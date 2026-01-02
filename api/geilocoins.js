import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DB_ID = process.env.NOTION_DB_ID;

const getNumber = (prop) => {
  if (!prop) return 0;

  if (prop.type === "number") return prop.number ?? 0;
  if (prop.type === "formula" && prop.formula.type === "number")
    return prop.formula.number ?? 0;

  return 0;
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const response = await notion.databases.query({
      database_id: DB_ID,
      filter: {
        property: "Name",
        title: { equals: "Gesamt" }
      },
      page_size: 1
    });

    if (!response.results.length) {
      return res.status(200).json({
        kontostand: 0,
        level: 1,
        progressPercent: 0,
        progressFraction: 0,
        rest: 100
      });
    }

    const p = response.results[0].properties;

    const kontostand = getNumber(p["Kontostand (Zahl)"]);
    const level = getNumber(p["Level"]);
    const progressFraction = getNumber(p["Fortschritt (Anteil)"]);
    const progressPercent = Math.round(progressFraction * 100);
    const rest = 100 - progressPercent;

    return res.status(200).json({
      kontostand,
      level,
      progressPercent,
      progressFraction,
      rest
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Serverfehler" });
  }
}
