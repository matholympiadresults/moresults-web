import { Text } from "@mantine/core";

/**
 * Map from ISO 3166-1 alpha-3 to alpha-2 country codes.
 * Flag emojis require 2-letter codes.
 */
const alpha3ToAlpha2: Record<string, string> = {
  afg: "AF", ago: "AO", alb: "AL", are: "AE", arg: "AR", arm: "AM", aus: "AU",
  aut: "AT", aze: "AZ", bdi: "BI", bel: "BE", ben: "BJ", bfa: "BF", bgd: "BD",
  bgr: "BG", bhr: "BH", bih: "BA", blr: "BY", bol: "BO", bra: "BR", brn: "BN",
  btn: "BT", bwa: "BW", caf: "CF", can: "CA", che: "CH", chl: "CL", chn: "CN", civ: "CI",
  cmr: "CM", cod: "CD", cog: "CG", col: "CO", cpv: "CV", cri: "CR", cub: "CU",
  cyp: "CY", cze: "CZ", deu: "DE", dji: "DJ", dnk: "DK", dom: "DO", dza: "DZ", ecu: "EC",
  egy: "EG", esp: "ES", est: "EE", eth: "ET", fin: "FI", fra: "FR", gab: "GA",
  gbr: "GB", geo: "GE", gha: "GH", gmb: "GM", gnb: "GW", gnq: "GQ", grc: "GR",
  gtm: "GT", guy: "GY", hkg: "HK", hnd: "HN", hrv: "HR", hun: "HU", idn: "ID",
  ind: "IN", irl: "IE", irn: "IR", irq: "IQ", isl: "IS", isr: "IL", ita: "IT",
  jam: "JM", jor: "JO", jpn: "JP", kaz: "KZ", ken: "KE", kgz: "KG", khm: "KH",
  kor: "KR", kos: "XK", kwt: "KW", lao: "LA", lbn: "LB", lbr: "LR", lby: "LY", xkx: "XK",
  lie: "LI", lka: "LK", lso: "LS", ltu: "LT", lux: "LU", lva: "LV", mac: "MO",
  mar: "MA", mda: "MD", mdg: "MG", mdv: "MV", mex: "MX", mkd: "MK", mli: "ML",
  mmr: "MM", mne: "ME", mng: "MN", moz: "MZ", mrt: "MR", mus: "MU", mwi: "MW",
  mys: "MY", nam: "NA", ner: "NE", nga: "NG", nic: "NI", nld: "NL", nor: "NO",
  npl: "NP", nzl: "NZ", omn: "OM", pak: "PK", pan: "PA", per: "PE", phl: "PH",
  png: "PG", pol: "PL", pri: "PR", prk: "KP", prt: "PT", pry: "PY", pse: "PS",
  qat: "QA", rou: "RO", rus: "RU", rwa: "RW", sau: "SA", sdn: "SD", sen: "SN",
  sgp: "SG", slb: "SB", sle: "SL", slv: "SV", smr: "SM", som: "SO", srb: "RS",
  ssd: "SS", svk: "SK", svn: "SI", swe: "SE", swz: "SZ", syr: "SY", tcd: "TD",
  tgo: "TG", tha: "TH", tjk: "TJ", tkm: "TM", tto: "TT", tun: "TN", tur: "TR",
  twn: "TW", tza: "TZ", uga: "UG", ukr: "UA", ury: "UY", usa: "US", uzb: "UZ",
  ven: "VE", vnm: "VN", yem: "YE", zaf: "ZA", zmb: "ZM", zwe: "ZW",
};

/**
 * Convert a country code (2-letter or 3-letter) to a flag emoji.
 * Uses regional indicator symbols to create flag emojis.
 */
export function countryCodeToFlag(code: string | null | undefined): string {
  if (!code) return "";

  let alpha2: string;
  if (code.length === 2) {
    alpha2 = code.toUpperCase();
  } else if (code.length === 3) {
    alpha2 = alpha3ToAlpha2[code.toLowerCase()] ?? "";
  } else {
    return "";
  }

  if (!alpha2 || alpha2.length !== 2) return "";

  const codePoints = [...alpha2].map(
    (char) => 0x1f1e6 - 65 + char.charCodeAt(0)
  );
  return String.fromCodePoint(...codePoints);
}

interface CountryFlagProps {
  code: string | null | undefined;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

/**
 * Display a country flag emoji for the given country code.
 */
export function CountryFlag({ code, size = "sm" }: CountryFlagProps) {
  const flag = countryCodeToFlag(code);
  if (!flag) return null;

  return (
    <Text component="span" size={size} style={{ lineHeight: 1 }}>
      {flag}
    </Text>
  );
}
