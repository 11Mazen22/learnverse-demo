"use client";

import { useEffect, useMemo, useState } from "react";
import {Icon} from "@/components/ui/icon";
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
type Profile = { xp: number; coins: number };
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [loading,setLoading]=useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<{
    coins?: number;
    xp?: number;
    tier?: string;
  } | null>(null);

  async function load() {
    setLoading(true);
    try{
    const [
      { data: itemRows, error:itemError },
      {
        data: { user },
      },
    ] = await Promise.all([
      supabase
        .from("shop_items")
        .select("id,slug,item_type,title_ar,title_en,price,asset_url")
        .eq("active", true)
        .order("price"),
      supabase.auth.getUser(),
    ]);
    if(itemError)throw itemError;
    setItems((itemRows ?? []) as Item[]);
    if (!user) {
      setProfile(null);
      setOwned(new Set());
      setEquipped(new Map());
      setBoxes([]);
      return;
    }
    const [{ data: p,error:profileError }, { data: inventory,error:inventoryError }, { data: eq,error:equippedError }, { data: boxRows,error:boxesError }] =
      await Promise.all([
        supabase.from("profiles").select("xp,coins").eq("id", user.id).single(),
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
      ]);
    if(profileError||inventoryError||equippedError||boxesError)throw profileError??inventoryError??equippedError??boxesError;
    setProfile(p as Profile | null);
    setOwned(new Set((inventory ?? []).map((x) => x.item_id)));
    setEquipped(
      new Map(((eq ?? []) as Equipped[]).map((x) => [x.slot, x.item_id])),
    );
    setBoxes((boxRows ?? []) as Box[]);
    }catch{setError("تعذّر تحميل المكافآت والرصيد. لن نعرض بيانات جديدة قبل التحقق من الاتصال.");}
    finally{setLoading(false);}

  }

  useEffect(() => {
    void load();
  }, []);

  async function buy(item: Item) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setBusy("buy:" + item.id);
    setError("");
    const { error } = await supabase.rpc("purchase_shop_item", {
      p_item_id: item.id,
      p_idempotency_key: crypto.randomUUID(),
    });
    if (error) setError(error.message);
    await load();
    setBusy(null);
  }

  async function equip(item: Item) {
    setBusy("equip:" + item.id);
    setError("");
    const { error } = await supabase.rpc("equip_cosmetic", {
      p_item_id: item.id,
    });
    if (error) setError(error.message);
    await load();
    setBusy(null);
  }

  async function claim(box: Box) {
    setBusy("box:" + box.id);
    setError("");
    setLastReward(null);
    const { data, error } = await supabase.rpc("claim_reward_box", {
      p_box_id: box.id,
    });
    if (error) setError(error.message);
    else {
      const payload = (data ?? {}) as {
        reward?: { coins?: number; xp?: number; tier?: string };
      };
      setLastReward(payload.reward ?? null);
    }
    await load();
    setBusy(null);
  }

  const level = Math.floor(Number(profile?.xp ?? 0) / 100) + 1;
  const unclaimed = boxes.filter((x) => !x.claimed_at);

  return (
    <>
      <header className="topbar" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent)" }}>
            مساحة إنجازاتك
          </div>
          <h1 style={{ margin: "6px 0 0" }}>شخصيتك ومكافآتك</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="pill">{profile?"المستوى "+level:"رصيدك مرتبط بحسابك"}</span>
          <span className="pill">
            {profile?Number(profile.coins).toLocaleString()+" عملات":"—"}
          </span>
        </div>
      </header>

      <section
        className="hero"
        style={{
          minHeight: 240,
          display: "grid",
          gridTemplateColumns: "1fr minmax(170px,260px)",
          alignItems: "center",
        }}
      >
        <div>
          <div className="eyebrow">مكافآت التعلّم</div>
          <h2 style={{ fontSize: 34, margin: "8px 0" }}>
            ابني شخصيتك من إنجازاتك.
          </h2>
          <p>
            XP للتقدم فقط. عملات للـ cosmetics فقط. لا شراء ولا Mystery Box
            يغيّر الـ mastery — لأن الفهم لازم يفضل حقيقي.
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
          <Icon name="gift" size={66}/>
        </div>
      </section>

      {loading&&<p role="status">بنحمّل المكافآت…</p>}
      {error && (
        <div
          className="panel"
          style={{ marginTop: 14, color: "var(--danger)" }}
        >
          {error}<button type="button" className="btn" onClick={()=>{setError("");void load();}}>إعادة المحاولة</button>
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

      {unclaimed.length > 0 && (
        <section className="panel" style={{ marginTop: 18 }}>
          <div className="panel-head">
            <h2>صناديق المكافآت</h2>
            <span className="pill">{unclaimed.length} غير مفتوحة</span>
          </div>
          <div className="quest-list">
            {unclaimed.map((box) => (
              <div className="quest" key={box.id}>
                <div className="quest-icon"><Icon name="gift" size={22}/></div>
                <div>
                  <h3>{box.tier.toUpperCase()} Box</h3>
                  <p>Earned from {box.source.replaceAll("_", " ")}</p>
                </div>
                <button
                  className="btn"
                  onClick={() => void claim(box)}
                  disabled={busy === "box:" + box.id}
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
                key={{avatar:"الصورة الشخصية",outfit:"المظهر",companion:"الرفيق",background:"الخلفية"}[slot]??slot}
                style={{
                  padding: 14,
                  border: "1px solid var(--line)",
                  borderRadius: 15,
                }}
              >
                <small style={{ color: "var(--muted)" }}>{{avatar:"الصورة الشخصية",outfit:"المظهر",companion:"الرفيق",background:"الخلفية"}[slot]??slot}</small>
                <b style={{ display: "block", marginTop: 5 }}>
                  {item?.title_ar ?? "—"}
                </b>
              </div>
            );
          })}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
          gap: 14,
          marginTop: 18,
        }}
      >
        {items.map((item) => {
          const isOwned = owned.has(item.id);
          const isEquipped = equipped.get(item.item_type) === item.id;
          const canAfford = Number(profile?.coins ?? 0) >= item.price;
          return (
            <article className="panel" key={item.id}>
              <div
                style={{
                  height: 120,
                  borderRadius: 16,
                  background: "linear-gradient(145deg,#edf5ff,#dfeaff)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 44,
                }}
              >
                <Icon name="gift" size={42}/>
              </div>
              <h3>{item.title_ar}</h3>
              <p style={{ color: "var(--muted)", fontSize: 12 }}>
                {item.item_type} · {item.title_en}
              </p>
              {!isOwned ? (
                <button
                  disabled={busy === "buy:" + item.id}
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
                  disabled={isEquipped || busy === "equip:" + item.id}
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
