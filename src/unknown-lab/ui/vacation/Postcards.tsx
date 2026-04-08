import { useUnknownLabStore } from "@/unknown-lab/state/useUnknownLabStore";

export function Postcards() {
  const vacationScene = useUnknownLabStore((s) => s.vacationScene);
  const setVacationScene = useUnknownLabStore((s) => s.setVacationScene);

  const card = (id: "v1" | "v2" | "v3") => {
    const active = vacationScene === id;
    const symbol =
      id === "v1" ? "postcardSymbolV1" : id === "v2" ? "postcardSymbolV2" : "postcardSymbolV3";
    const label = id === "v1" ? "室內桌" : id === "v2" ? "花園" : "海島";
    return (
      <button
        key={id}
        type="button"
        className={`unknownPostcard ${active ? "unknownPostcard--active" : ""}`}
        onClick={() => setVacationScene(id)}
        aria-label={`Vacation ${id}`}
      >
        <span className={`unknownPostcardSymbol ${symbol}`} aria-hidden />
        <span className="unknownMicroTag" aria-hidden>
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="flex items-center gap-2">
      {card("v1")}
      {card("v2")}
      {card("v3")}
    </div>
  );
}

