"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";

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
  const t=useTranslation(),locale=useLocale();
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
      if (boxesError) setError(t("المتجر متاح لكن صندوق المكافآت مش متاح حاليًا. جرّب تحديث الصفحة.","The shop is available, but reward boxes are temporarily unavailable. Refresh the page to try again."));
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
          t("تعذّر تحميل المكافآت والرصيد. لن نعرض بيانات جديدة قبل التحقق من الاتصال.","Could not load rewards and balances. New data will appear after the connection is verified."),
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
        <button type="button" onClick={() => void account.refresh()}>{t("إعادة المحاولة","Try again")}</button>
      </section>
    );
  return (
    <>
      <header className="noata-section-head">
        <div><p className="noata-eyebrow">{t("رحلتك تستحق الاحتفال","Celebrate your learning journey")}</p>
          <h1>{t("مكافآتك وإنجازاتك","Your rewards and achievements")}</h1>
          <p>{t("كل مكافأة هنا نتيجة لتقدم حقيقي. اجمع العملات من التعلّم واختار مظهر يعبر عنك. الجواهر 5 عند إتقان درس موثّق بنسبة 90٪، و3 إضافية عند 100٪، مرة واحدة لكل مستوى استحقاق.","Earn Coins through learning and choose a look that reflects you. Verified lesson mastery earns 5 Gems at 90% and another 3 at 100%, once for each eligibility level.")}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="pill">
            {profile ? t("المستوى ","Level ") + level : t("رصيدك مرتبط بحسابك","Your balance belongs to your account")}
          </span>
          <span className="pill">
            {profile && !loading && !error
              ? Number(profile.coins).toLocaleString(locale==="en"?"en":"ar-EG") + t(" عملات"," Coins")
              : "—"}
          </span>
          <span className="pill" title={t("جواهر موثّقة من إتقان الدروس، وليست مكافآت متوقعة","Gems confirmed from lesson mastery, rather than expected rewards")}>
            {profile && !loading && !error
              ? Number(profile.gems).toLocaleString(locale==="en"?"en":"ar-EG") + " 💎 Gems"
              : "—"}
          </span>
        </div>
      </header>

      <section className="hero noata-rewards-hero">
        <div>
          <div className="eyebrow">{t("مكافآت التعلّم","Learning rewards")}</div>
          <h2 style={{ fontSize: 34, margin: "8px 0" }}>{t("تعلّم أكتر. افتح مكافآت أكتر.","Keep learning. Unlock more rewards.")}</h2>
          <p>{t("نقاط الخبرة تعكس تعلمك، والعملات تقدر تستخدمها لمظاهر شخصيتك فقط. المشتريات ما بتغيّرش نتيجة أي اختبار أو مستوى إتقان.","XP reflects your learning. Coins buy cosmetic items only. Purchases do not change assessment results or mastery.")}</p>
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

      {(account.loading || loading) && <p role="status">{t("بنحمّل المكافآت…","Loading rewards…")}</p>}
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
          >{t("إعادة المحاولة","Try again")}</button>
        </div>
      )}
      {lastReward && (
        <div className="panel" style={{ marginTop: 14, textAlign: "center" }}>
          <b>🎁 {lastReward.tier?.toUpperCase()} BOX</b>
          <p>
            +{lastReward.coins ?? 0}{t("عملات · +","Coins · +")}{lastReward.xp ?? 0} XP
          </p>
        </div>
      )}

      {!loading && account.user && unclaimed.length === 0 && !error && (
        <section className="noata-empty" style={{ marginTop: 18 }}>
          <span className="noata-empty-icon" aria-hidden="true">🎁</span>
          <h2>{t("مفيش صناديق مستحقة دلوقتي","No reward boxes are due right now")}</h2>
          <p>{t("الصناديق بتظهر لما تستحقها من مهام ونتائج حقيقية. مفيش صندوق مجاني وهمي أو زر فتح من غير مكافأة على حسابك.","Reward boxes appear when earned through verified missions and results. You can open a box only when it belongs to your account.")}</p>
          <a className="btn btn-primary" href="/missions">{t("شوف المهام المتاحة","View available missions")}</a>
        </section>
      )}
      {!loading && !account.user && (
        <section className="noata-empty" style={{ marginTop: 18 }}>
          <h2>{t("احتفظ بمكافآتك على حسابك","Keep your rewards in your account")}</h2>
          <p>{t("تقدر تتصفح المتجر بحرية. سجّل الدخول عشان يظهر رصيدك الحقيقي وتقدر تستخدم مكافآتك.","Explore the shop freely. Sign in to view your actual balance and use your rewards.")}</p>
          <a className="btn btn-primary" href="/login?next=/rewards">{t("تسجيل الدخول","Sign in")}</a>
        </section>
      )}
      {unclaimed.length > 0 && (
        <section className="panel" style={{ marginTop: 18 }}>
          <div className="panel-head">
            <h2>{t("صناديق المكافآت","Reward boxes")}</h2>
            <span className="pill">{unclaimed.length}{t("غير مفتوحة","unopened")}</span>
          </div>
          <div className="quest-list">
            {unclaimed.map((box) => (
              <div className="quest" key={box.id}>
                <div className="quest-icon">
                  <Icon name="gift" size={22} />
                </div>
                <div>
                  <h3>{t("صندوق","Box")}{box.tier === "gold" ? t("ذهبي","Gold") : box.tier === "silver" ? t("فضي","Silver") : box.tier === "bronze" ? t("برونزي","Bronze") : t("مكافآت","Reward")}</h3>
                  <p>{t("مكافأة مُكتسبة من تقدمك في التعلّم","Earned through your learning progress")}</p>
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
                  {busy === "box:" + box.id ? t("جارٍ الفتح…","Opening…") : t("افتح الصندوق","Open box")}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-head">
          <h2>{t("مظهرك الحالي","Your current look")}</h2>
          <span className="pill">{equipped.size}{t("خيارات مفعّلة","items equipped")}</span>
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
                    avatar: t("الصورة الشخصية","Avatar"),
                    outfit: t("المظهر","Outfit"),
                    companion: t("الرفيق","Companion"),
                    background: t("الخلفية","Background"),
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
                    avatar: t("الصورة الشخصية","Avatar"),
                    outfit: t("المظهر","Outfit"),
                    companion: t("الرفيق","Companion"),
                    background: t("الخلفية","Background"),
                  }[slot] ?? slot}
                </small>
                <b style={{ display: "block", marginTop: 5 }}>
                  {item?(locale==="en"?item.title_en:item.title_ar):"—"}
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
              <h2 id="noata-ledger-title">{t("سجل نقاطك ومكافآتك","Your points and rewards history")}</h2>
              <p>{t("آخر 30 حركة مؤكدة من الخادم، وليست مكافآت متوقعة.","Your latest 30 server-confirmed transactions.")}</p>
            </div>
            <button type="button" className="noata-ledger-refresh" disabled={loading || mutating}
              onClick={() => void load()}><Icon name="refresh" size={17}/>{t("تحديث","Refresh")}</button>
          </div>
          {ledgerError ? <div className="noata-ledger-message" role="status">{t("السجل غير متاح حاليًا. يمكن إعادة المحاولة.","History is currently unavailable. Please try again.")}</div>
          : ledger.length === 0 ? <div className="noata-ledger-message" role="status">{t("مفيش معاملات مؤكدة في حسابك حتى الآن.","There are no confirmed transactions in your account yet.")}</div>
          : <ol className="noata-ledger-list">{ledger.map(entry => {
              const credit = Number(entry.amount) >= 0;
              const unit = entry.currency === "XP" ? "XP" : entry.currency === "COIN" ? t("عملة","Coin")
                : entry.currency === "GEM" ? t("جوهرة","Gem") : entry.currency;
              const date = new Date(entry.created_at);
              return <li key={entry.id} className="noata-ledger-entry">
                <span className={"noata-ledger-symbol " + (credit?"credit":"debit")} aria-hidden="true"><Icon name={credit?"plus":"gift"} size={17}/></span>
                <span className="noata-ledger-detail"><strong>{entry.reason || t("حركة رصيد مؤكدة","Confirmed balance transaction")}</strong>
                <small>{entry.reference_type ? t("المصدر: ","Source: ") + entry.reference_type + " · " : ""}
                  {Number.isNaN(date.getTime()) ? t("وقت غير متاح","Time unavailable") : date.toLocaleString(locale==="en"?"en":"ar-EG",{dateStyle:"medium",timeStyle:"short"})}
                </small></span>
                <strong className={"noata-ledger-value " + (credit?"credit":"debit")} dir="ltr">
                  {credit?"+":"−"}{Math.abs(Number(entry.amount)||0).toLocaleString(locale==="en"?"en":"ar-EG")} {unit}</strong>
              </li>;
            })}</ol>}
        </section>
      )}

      {!loading && items.length === 0 && !error && <section className="noata-empty"><h2>{t("متجر المظاهر قيد التجهيز","The cosmetic shop is being prepared")}</h2><p>{t("لسه مفيش عناصر منشورة للشراء. مكافآتك الحالية محفوظة في حسابك.","No items are available to buy yet. Your rewards remain saved in your account.")}</p></section>}
      <section className="noata-reward-grid" aria-label={t("متجر المظاهر","Cosmetic shop")}>
        {items.map((item) => {
          const isOwned = owned.has(item.id);
          const isEquipped = equipped.get(item.item_type) === item.id;
          const canAfford = Number(profile?.coins ?? 0) >= item.price;
          return (
            <article className="noata-reward-card" key={item.id}>
              <div className="noata-reward-visual">
                <Icon name="gift" size={42} />
              </div>
              <h3>{locale==="en"?item.title_en:item.title_ar}</h3>
              <p style={{ color: "var(--muted)", fontSize: 12 }}>
                {item.item_type === "avatar" ? t("صورة شخصية","Avatar") : item.item_type === "outfit" ? t("زي مميز","Outfit") : item.item_type === "companion" ? t("رفيق","Companion") : t("مظهر إضافي","Cosmetic item")}
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
                    ? t("جارٍ الشراء…","Purchasing…")
                    : item.price === 0
                      ? t("احصل عليه مجانًا","Get it free")
                      : item.price + t(" عملات"," Coins")}
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
                    ? t("مظهرك الحالي","Your current look")
                    : busy === "equip:" + item.id
                      ? t("جارٍ الاستخدام…","Equipping…")
                      : t("استخدم المظهر","Equip item")}
                </button>
              )}
              {profile && !isOwned && !canAfford && (
                <small
                  style={{ display: "block", marginTop: 8, color: "#9a6b1d" }}
                >{t("محتاج عملات أكتر","More Coins needed")}</small>
              )}
            </article>
          );
        })}
      </section>
    </>
  );
}
