import { useMemo, useState } from "react";
import styles from "./MarginCalculator.module.css";

export default function MarginCalculator() {
  const [costInput, setCostInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [profitInput, setProfitInput] = useState("");
  const [marginInput, setMarginInput] = useState("");
  const [sourceFields, setSourceFields] = useState<string[]>([]);

  const parseNumber = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : NaN;
  };

  const updateSourceFields = (field: string) => {
    setSourceFields((prev) => {
      const next = [field, ...prev.filter((f) => f !== field)];
      return next.slice(0, 2);
    });
  };

  const {
    displayCost,
    displayPrice,
    displayProfit,
    displayMargin,
    errorMessage,
  } = useMemo(() => {
    const cost = parseNumber(costInput);
    const price = parseNumber(priceInput);
    const profit = parseNumber(profitInput);
    const margin = parseNumber(marginInput);

    const hasCost = cost !== undefined;
    const hasPrice = price !== undefined;
    const hasProfit = profit !== undefined;
    const hasMargin = margin !== undefined;

    const isNum = (n: number | undefined) => n !== undefined && !Number.isNaN(n);

    if (hasPrice && Number.isNaN(price)) {
      return { errorMessage: "Price must be a number" };
    }
    if (hasCost && Number.isNaN(cost)) {
      return { errorMessage: "Cost must be a number" };
    }
    if (hasProfit && Number.isNaN(profit)) {
      return { errorMessage: "Profit must be a number" };
    }
    if (hasMargin && Number.isNaN(margin)) {
      return { errorMessage: "Margin must be a number" };
    }

    if (hasPrice && price !== undefined && price <= 0) {
      return { errorMessage: "Price must be greater than zero" };
    }
    if (hasCost && cost !== undefined && cost < 0) {
      return { errorMessage: "Cost cannot be negative" };
    }
    if (hasMargin && margin !== undefined && margin <= 0) {
      return { errorMessage: "Margin must be greater than zero" };
    }
    if (hasMargin && margin !== undefined && margin >= 100) {
      return { errorMessage: "Margin must be less than 100" };
    }

    const filledNames = [
      hasPrice ? "price" : null,
      hasCost ? "cost" : null,
      hasProfit ? "profit" : null,
      hasMargin ? "margin" : null,
    ].filter(Boolean) as string[];

    if (filledNames.length < 2) {
      return { errorMessage: "Enter any two values to calculate the others" };
    }

    const source = sourceFields.filter((name) => filledNames.includes(name));
    const sources = source.length >= 2 ? source.slice(0, 2) : filledNames.slice(0, 2);

    const values: Record<string, number | undefined> = {
      cost,
      price,
      profit,
      margin,
    };

    const [a, b] = sources;

    let derivedCost = values.cost;
    let derivedPrice = values.price;
    let derivedProfit = values.profit;
    let derivedMargin = values.margin;

    const safeDivide = (numerator: number, denominator: number) => {
      if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return NaN;
      return numerator / denominator;
    };

    const solve = (first: string, second: string) => {
      const v1 = values[first];
      const v2 = values[second];
      if (!isNum(v1) || !isNum(v2)) return;

      // price & cost
      if ((first === "price" && second === "cost") || (first === "cost" && second === "price")) {
        derivedPrice = values.price;
        derivedCost = values.cost;
        derivedProfit = (values.price as number) - (values.cost as number);
        derivedMargin = safeDivide(derivedProfit, values.price as number) * 100;
        return;
      }

      // price & profit
      if ((first === "price" && second === "profit") || (first === "profit" && second === "price")) {
        derivedPrice = values.price;
        derivedProfit = values.profit;
        derivedCost = (values.price as number) - (values.profit as number);
        derivedMargin = safeDivide(values.profit as number, values.price as number) * 100;
        return;
      }

      // price & margin
      if ((first === "price" && second === "margin") || (first === "margin" && second === "price")) {
        derivedPrice = values.price;
        derivedMargin = values.margin;
        derivedProfit = safeDivide((values.price as number) * (values.margin as number), 100);
        derivedCost = (values.price as number) - derivedProfit;
        return;
      }

      // cost & profit
      if ((first === "cost" && second === "profit") || (first === "profit" && second === "cost")) {
        derivedCost = values.cost;
        derivedProfit = values.profit;
        derivedPrice = (values.cost as number) + (values.profit as number);
        derivedMargin = safeDivide(values.profit as number, derivedPrice) * 100;
        return;
      }

      // cost & margin
      if ((first === "cost" && second === "margin") || (first === "margin" && second === "cost")) {
        derivedCost = values.cost;
        derivedMargin = values.margin;
        const priceFromMargin = safeDivide(values.cost as number, 1 - (values.margin as number) / 100);
        derivedPrice = priceFromMargin;
        derivedProfit = priceFromMargin - (values.cost as number);
        return;
      }

      // profit & margin
      if ((first === "profit" && second === "margin") || (first === "margin" && second === "profit")) {
        derivedProfit = values.profit;
        derivedMargin = values.margin;
        const priceFromMargin = safeDivide(values.profit as number, (values.margin as number) / 100);
        derivedPrice = priceFromMargin;
        derivedCost = priceFromMargin - (values.profit as number);
        return;
      }
    };

    solve(a, b);

    const anyNaN = [derivedPrice, derivedCost, derivedProfit, derivedMargin].some(
      (v) => v !== undefined && Number.isNaN(v as number)
    );
    if (anyNaN) {
      return { errorMessage: "Cannot compute with the provided values" };
    }

    const formatVal = (val: number | undefined) => {
      if (val === undefined || !Number.isFinite(val)) return undefined;
      return Math.abs(val) >= 1 ? val.toFixed(2) : val.toPrecision(3);
    };

    const inSources = (name: string) => sources.includes(name);

    const displayCost = inSources("cost") ? costInput : formatVal(derivedCost) ?? costInput;
    const displayPrice = inSources("price") ? priceInput : formatVal(derivedPrice) ?? priceInput;
    const displayProfit = inSources("profit") ? profitInput : formatVal(derivedProfit) ?? profitInput;
    const displayMargin = inSources("margin") ? marginInput : formatVal(derivedMargin) ?? marginInput;

    return {
      displayCost,
      displayPrice,
      displayProfit,
      displayMargin,
      computedProfit: derivedProfit,
      computedMargin: derivedMargin,
      errorMessage: undefined,
    };
  }, [costInput, priceInput, profitInput, marginInput, sourceFields]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Margin Calculator</h1>
        {errorMessage && <p className={styles.error}>{errorMessage}</p>}
        
        <div className={styles.inputGroup}>
          <label htmlFor="cost" className={styles.label}>Cost</label>
          <input
            type="text"
            inputMode="decimal"
            id="cost"
            className={styles.input}
            value={displayCost}
            onChange={(e) => {
              setCostInput(e.target.value);
              updateSourceFields("cost");
            }}
            placeholder="Enter cost amount"
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="price" className={styles.label}>Price</label>
          <input
            type="text"
            inputMode="decimal"
            id="price"
            className={styles.input}
            value={displayPrice}
            onChange={(e) => {
              setPriceInput(e.target.value);
              updateSourceFields("price");
            }}
            placeholder="Enter selling price"
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="profit" className={styles.label}>Profit</label>
          <input
            type="text"
            inputMode="decimal"
            id="profit"
            className={styles.input}
            value={displayProfit}
            onChange={(e) => {
              setProfitInput(e.target.value);
              updateSourceFields("profit");
            }}
            placeholder="Enter profit amount"
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="margin" className={styles.label}>Margin (%)</label>
          <input
            type="text"
            inputMode="decimal"
            id="margin"
            className={styles.input}
            value={displayMargin}
            onChange={(e) => {
              setMarginInput(e.target.value);
              updateSourceFields("margin");
            }}
            placeholder="Enter margin percentage"
          />
        </div>
      </div>
    </div>
  );
}
