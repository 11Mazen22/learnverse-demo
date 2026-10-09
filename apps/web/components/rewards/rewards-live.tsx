"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useConfirmedMutation } from "@/lib/supabase/use-confirmed-mutation";
import { createOperationKeys } from "@/lib/ai/operation-keys";
import { createClient } from "@/lib/supabase/client";

type Item = {
  id: string;
  slug: string;
  item_type: string;
  title_ar: string;
  title_en: string;
  price: number;
  asset_url: string | null;
};
type Profile = { xp: number; coins: number; gems: number };
type LedgerRow = { id:string;currency:string;amount:number;reason:string;reference_type:string|null;created_at:string };
type Box = {
  id: string;
  tier: string;
  source: string;
  claimed_at: string | null;
  reward: unknown;
};
type Equipped = { slot: string; item_id: string };

export function RewardsLive() {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Item[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [equipped, setEquipped] = useState<Map<string, string>>(new Map());
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [ledgerError, setLedgerError] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const {
    account,
    busy: mutating,
    status: mutationStatus,
    run,
  } = useConfirmedMutation();
  const keys = useRef(createOperationKeys());
  const [action, setBusy] = useState<string | null>(null);
  const busy = mutating ? action : null;
  const [lastReward, setLastReward] = useState<{
    coins?: number;
    xp?: number;
    tier?: string;
  } | null>(null);

  async function load() {
    const token = account.revision.current;
    setLoading(true);
    setError("");
    try {
      const { data: itemRows, error: itemError } = await supabase
        .from("shop_items")
        .select("id,slug,item_type,title_ar,title_en,price,asset_url")
        .eq("active", true)
        .order("price");
      if (token !== account.revision.current) return;
      const user = account.user;
      if (itemError) throw itemError;
      setItems((itemRows ?? []) as Item[]);
      if (!user) {
        setProfile(null);
        setOwned(new Set());
        setEquipped(new Map());
        setBoxes([]);
        setLedger([]);
        setLedgerError(false);
        return;
      }
      const [
        { data: p, error: profileError },
        { data: inventory, error: inventoryError },
        { data: eq, error: equippedError },
        { data: boxRows, error: boxesError },
        { data: ledgerRows, error: ledgerQueryError },
      ] = await Promise.all([
        supabase.from("profiles").select("xp,coins,gems").eq("id", user.id).maybeSingle(),
        supabase.from("inventory").select("item_id").eq("user_id", user.id),
        supabase
          .from("equipped_cosmetics")
          .select("slot,item_id")
          .eq("user_id", user.id),
        supabase
          .from("reward_boxes")
          .select("id,tier,source,claimed_at,reward")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("ledger").select("id,currency,amount,reason,reference_type,created_at")
          .eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
      ]);
      if (token !== account.revision.current) return;
      if (profileError || inventoryError || equippedError)
        throw profileError ?? inventoryError ?? equippedError;
      if (boxesError) setError("المتجر متاح لكن صندوق المكافآت مش متاح حاليًا. جرّب تحديث الصفحة.");
      setProfile(p as Profile | null);
      setOwned(new Set((inventory ?? []).map((x) => x.item_id)));
      setEquipped(
        new Map(((eq ?? []) as Equipped[]).map((x) => [x.slot, x.item_id])),
      );
      setBoxes(boxesError ? [] : (boxRows ?? []) as Box[]);
      setLedger(ledgerQueryError ? [] : (ledgerRows ?? []) as LedgerRow[]);
      setLedgerError(Boolean(ledgerQueryError));
    } catch {
      if (token === account.revision.current)
        setError(
          "تعذّر تحميل المكافآت والرصيد. لن نعرض بيانات جديدة قبل التحقق من الاتصال.",
        );
    } finally {
      if (token === account.revision.current) setLoading(false);
    }
  }

  useEffect(() => {
    setProfile(null);
    setOwned(new Set());
    setEquipped(new Map());
    setBoxes([]);
    setLedger([]);
    setLedgerError(false);
    setLastReward(null);
    keys.current.clear();
    setBusy(null);
    if (!account.loading) void load();
  }, [account.user, account.loading]);

  async function buy(item: Item) {
    if (!account.user) {
      window.location.href = "/login?next=/rewards";
      return;
    }
    await run(async (check) => {
      setBusy("buy:" + item.id);
      setError("");
      const result = await supabase.rpc("purchase_shop_item", {
        p_item_id: item.id,
        p_idempotency_key: keys.current.get("buy:" + item.id),
      });
      check();
      if (result.error) throw result.error;
      keys.current.confirmed("buy:" + item.id);
      await load();
      check();
      setBusy(null);
    }, "");
  }
  async function equip(item: Item) {
    await run(async (check) => {
      setBusy("equip:" + item.id);
      setError("");
      const result = await supabase.rpc("equip_cosmetic", {
        p_item_id: item.id,
      });
      check();
      if (result.error) throw result.error;
      await load();
      check();
      setBusy(null);
    }, "");
  }
  async function claim(box: Box) {
    await run(async (check) => {
      setBusy("box:" + box.id);
      setError("");
      setLastReward(null);
      const result = await supabase.rpc("claim_reward_box", {
        p_box_id: box.id,
      });
      check();
      if (result.error) throw result.error;
      const payload = result.data as {
        reward?: { coins?: number; xp?: number; tier?: string };
      } | null;
      if (!payload?.reward) throw Error("Missing confirmed reward");
      setLastReward(payload.reward);
      await load();
      check();
      setBusy(null);
    }, "");
  }

  const level = Math.floor(Number(profile?.xp ?? 0) / 100) + 1;
  const unclaimed = boxes.filter((x) => !x.claimed_at);

  if (account.error)
    return (
      <section className="aura-load-error" role="alert">
        <h2>{account.error}</h2>
        <button type="button" onClick={() => void account.refresh()}>
          إعادة المحاولة
        </button>
      </section>
    );
  return (
    <>
      <header className="noata-section-head">
        <div><p className="noata-eyebrow">رحلتك تستحق الاحتفال</p>
          <h1>مكافآتك وإنجازاتك</h1>
          <p>كل مكافأة هنا نتيجة لتقدم حقيقي. اجمع العملات من التعلّم واختار مظهر يعبر عنك. الجواهر 5 عند إتقان درس موثّق بنسبة 90٪، و3 إضافية عند 100٪، مرة واحدة لكل مستوى استحقاق.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="pill">
            {profile ? "المستوى " + level : "رصيدك مرتبط بحسابك"}
          </span>
          <span className="pill">
            {profile && !loading && !error
              ? Number(profile.coins).toLocaleString("ar-EG") + " عملات"
              : "—"}
          </span>
          <span className="pill" title="جواهر موثّقة من إتقان الدروس، وليست مكافآت متوقعة">
            {profile && !loading && !error
              ? Number(profile.gems).toLocaleString("ar-EG") + " 💎 Gems"
              : "—"}
          </span>
        </div>
      </header>

      <section className="hero noata-rewards-hero">
        <div>
          <div className="eyebrow">مكافآت التعلّم</div>
          <h2 style={{ fontSize: 34, margin: "8px 0" }}>
            تعلّم أكتر. افتح مكافآت أكتر.
          </h2>
          <p>
            نقاط الخبرة تعكس تعلمك، والعملات تقدر تستخدمها لمظاهر شخصيتك فقط. المشتريات ما بتغيّرش نتيجة أي اختبار أو مستوى إتقان.
          </p>
        </div>
        <div
          style={{
            height: 180,
            borderRadius: 28,
            background:
              "linear-gradient(145deg,rgba(255,255,255,.14),rgba(255,255,255,.04))",
            display: "grid",
            placeItems: "center",
            fontSize: 72,
          }}
        >
          <Icon name="gift" size={66} />
        </div>
      </section>

      {(account.loading || loading) && <p role="status">بنحمّل المكافآت…</p>}
      {(error || mutationStatus) && (
        <div
          className="panel"
          role="alert"
          style={{ marginTop: 14, color: "var(--danger)" }}
        >
          {error || mutationStatus}
          <button
            type="button"
            className="btn"
            onClick={() => {
              setError("");
              void load();
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      )}
      {lastReward && (
        <div className="panel" style={{ marginTop: 14, textAlign: "center" }}>
          <b>🎁 {lastReward.tier?.toUpperCase()} BOX</b>
          <p>
            +{lastReward.coins ?? 0} عملات · +{lastReward.xp ?? 0} XP
          </p>
        </div>
      )}

      {!loading && account.user && unclaimed.length === 0 && !error && (
        <section className="noata-empty" style={{ marginTop: 18 }}>
          <span className="noata-empty-icon" aria-hidden="true">🎁</span>
          <h2>مفيش صناديق مستحقة دلوقتي</h2>
          <p>الصناديق بتظهر لما تستحقها من مهام ونتائج حقيقية. مفيش صندوق مجاني وهمي أو زر فتح من غير مكافأة على حسابك.</p>
          <a className="btn btn-primary" href="/missions">شوف المهام المتاحة</a>
        </section>
      )}
      {!loading && !account.user && (
        <section className="noata-empty" style={{ marginTop: 18 }}>
          <h2>احتفظ بمكافآتك على حسابك</h2>
          <p>تقدر تتصفح المتجر بحرية. سجّل الدخول عشان يظهر رصيدك الحقيقي وتقدر تستخدم مكافآتك.</p>
          <a className="btn btn-primary" href="/login?next=/rewards">تسجيل الدخول</a>
        </section>
      )}
      {unclaimed.length > 0 && (
        <section className="panel" style={{ marginTop: 18 }}>
          <div className="panel-head">
            <h2>صناديق المكافآت</h2>
            <span className="pill">{unclaimed.length} غير مفتوحة</span>
          </div>
          <div className="quest-list">
            {unclaimed.map((box) => (
              <div className="quest" key={box.id}>
                <div className="quest-icon">
                  <Icon name="gift" size={22} />
                </div>
                <div>
                  <h3>صندوق {box.tier === "gold" ? "ذهبي" : box.tier === "silver" ? "فضي" : box.tier === "bronze" ? "برونزي" : "مكافآت"}</h3>
                  <p>مكافأة مُكتسبة من تقدمك في التعلّم</p>
                </div>
                <button
                  className="btn"
                  onClick={() => void claim(box)}
                  disabled={mutating || busy === "box:" + box.id}
                  style={{
                    background: "var(--accent)",
                    color: "var(--surface)",
                  }}
                >
                  {busy === "box:" + box.id ? "جارٍ الفتح…" : "افتح الصندوق"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-head">
          <h2>مظهرك الحالي</h2>
          <span className="pill">{equipped.size} خيارات مفعّلة</span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
            gap: 10,
          }}
        >
          {["avatar", "outfit", "companion", "background"].map((slot) => {
            const item = items.find((x) => x.id === equipped.get(slot));
            return (
              <div
                key={
                  {
                    avatar: "الصورة الشخصية",
                    outfit: "المظهر",
                    companion: "الرفيق",
                    background: "الخلفية",
                  }[slot] ?? slot
                }
                style={{
                  padding: 14,
                  border: "1px solid var(--line)",
                  borderRadius: 15,
                }}
              >
                <small style={{ color: "var(--muted)" }}>
                  {{
                    avatar: "الصورة الشخصية",
                    outfit: "المظهر",
                    companion: "الرفيق",
                    background: "الخلفية",
                  }[slot] ?? slot}
                </small>
                <b style={{ display: "block", marginTop: 5 }}>
                  {item?.title_ar ?? "—"}
                </b>
              </div>
            );
          })}
        </div>
      </section>

      {!loading && account.user && (
        <section className="panel noata-ledger-section" aria-labelledby="noata-ledger-title">
          <div className="panel-head">
            <div>
              <h2 id="noata-ledger-title">سجل نقاطك ومكافآتك</h2>
              <p>آخر 30 حركة مؤكدة من الخادم، وليست مكافآت متوقعة.</p>
            </div>
            <button type="button" className="noata-ledger-refresh" disabled={loading || mutating}
              onClick={() => void load()}><Icon name="refresh" size={17}/> تحديث</button>
          </div>
          {ledgerError ? <div className="noata-ledger-message" role="status">السجل غير متاح حاليًا. يمكن إعادة المحاولة.</div>
          : ledger.length === 0 ? <div className="noata-ledger-message" role="status">مفيش معاملات مؤكدة في حسابك حتى الآن.</div>
          : <ol className="noata-ledger-list">{ledger.map(entry => {
              const credit = Number(entry.amount) >= 0;
              const unit = entry.currency === "XP" ? "XP" : entry.currency === "COIN" ? "عملة"
                : entry.currency === "GEM" ? "جوهرة" : entry.currency;
              const date = new Date(entry.created_at);
              return <li key={entry.id} className="noata-ledger-entry">
                <span className={"noata-ledger-symbol " + (credit?"credit":"debit")} aria-hidden="true"><Icon name={credit?"plus":"gift"} size={17}/></span>
                <span className="noata-ledger-detail"><strong>{entry.reason || "حركة رصيد مؤكدة"}</strong>
                <small>{entry.reference_type ? "المصدر: " + entry.reference_type + " · " : ""}
                  {Number.isNaN(date.getTime()) ? "وقت غير متاح" : date.toLocaleString("ar-EG",{dateStyle:"medium",timeStyle:"short"})}
                </small></span>
                <strong className={"noata-ledger-value " + (credit?"credit":"debit")} dir="ltr">
                  {credit?"+":"−"}{Math.abs(Number(entry.amount)||0).toLocaleString("ar-EG")} {unit}</strong>
              </li>;
            })}</ol>}
        </section>
      )}

      {!loading && items.length === 0 && !error && <section className="noata-empty"><h2>متجر المظاهر قيد التجهيز</h2><p>لسه مفيش عناصر منشورة للشراء. مكافآتك الحالية محفوظة في حسابك.</p></section>}
      <section className="noata-reward-grid" aria-label="متجر المظاهر">
        {items.map((item) => {
          const isOwned = owned.has(item.id);
          const isEquipped = equipped.get(item.item_type) === item.id;
          const canAfford = Number(profile?.coins ?? 0) >= item.price;
          return (
            <article className="noata-reward-card" key={item.id}>
              <div className="noata-reward-visual">
                <Icon name="gift" size={42} />
              </div>
              <h3>{item.title_ar}</h3>
              <p style={{ color: "var(--muted)", fontSize: 12 }}>
                {item.item_type === "avatar" ? "صورة شخصية" : item.item_type === "outfit" ? "زي مميز" : item.item_type === "companion" ? "رفيق" : "مظهر إضافي"}
              </p>
              {!isOwned ? (
                <button
                  disabled={mutating || loading || Boolean(account.user && !profile) || busy === "buy:" + item.id}
                  onClick={() => void buy(item)}
                  className="btn"
                  style={{
                    width: "100%",
                    background: "var(--accent)",
                    color: "var(--surface)",
                  }}
                >
                  {busy === "buy:" + item.id
                    ? "جارٍ الشراء…"
                    : item.price === 0
                      ? "احصل عليه مجانًا"
                      : item.price + " عملات"}
                </button>
              ) : (
                <button
                  disabled={mutating || isEquipped || busy === "equip:" + item.id}
                  onClick={() => void equip(item)}
                  className="btn"
                  style={{
                    width: "100%",
                    background: isEquipped ? "#e9f7f0" : "var(--accent)",
                    color: isEquipped ? "var(--success)" : "white",
                  }}
                >
                  {isEquipped
                    ? "مظهرك الحالي"
                    : busy === "equip:" + item.id
                      ? "جارٍ الاستخدام…"
                      : "استخدم المظهر"}
                </button>
              )}
              {profile && !isOwned && !canAfford && (
                <small
                  style={{ display: "block", marginTop: 8, color: "#9a6b1d" }}
                >
                  محتاج عملات أكتر
                </small>
              )}
            </article>
          );
        })}
      </section>
    </>
  );
}
