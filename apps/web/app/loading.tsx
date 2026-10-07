export default function Loading() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 28,
        maxWidth: 1180,
        margin: "0 auto",
      }}
    >
      <div
        className="skeleton"
        style={{ height: 48, width: 220, borderRadius: 14 }}
      />
      <div
        className="skeleton"
        style={{ height: 260, borderRadius: 28, marginTop: 22 }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 14,
          marginTop: 18,
        }}
      >
        {[1, 2, 3, 4].map((x) => (
          <div
            className="skeleton"
            key={x}
            style={{ height: 120, borderRadius: 20 }}
          />
        ))}
      </div>
    </main>
  );
}
