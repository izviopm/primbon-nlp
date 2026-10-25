import { JODOH, SUMBER_JODOH, SUMBER_WATAK, WATAK, neptuHari, neptuPasaran, type Hari, type Pasaran } from "./data.ts";
import { banding, dariIso, iso, tambahHari, wetonDari } from "./kalender.ts";
import type { Baris, JalankanRpc } from "./evaluator.ts";

// Database tiruan untuk unit test: meniru fungsi primbon_* di Postgres dengan data dari data.ts.

function wetonDariArgs(h: string | null, p: string | null, t: string | null) {
  const x = t ? wetonDari(dariIso(t)) : { hari: h as Hari, pasaran: p as Pasaran };
  const nh = neptuHari(x.hari);
  const np = neptuPasaran(x.pasaran);
  return { hari: x.hari, pasaran: x.pasaran, neptu_hari: nh, neptu_pasaran: np, neptu: nh + np };
}

export const jalankanMemori: JalankanRpc = async (rpc, a) => {
  switch (rpc) {
    case "primbon_weton":
      return [wetonDariArgs(null, null, a.p_tanggal)];
    case "primbon_neptu":
      return [wetonDariArgs(a.p_hari, a.p_pasaran, a.p_tanggal)];
    case "primbon_watak": {
      const x = wetonDariArgs(a.p_hari, a.p_pasaran, a.p_tanggal);
      return [{ hari: x.hari, pasaran: x.pasaran, neptu: x.neptu, deskripsi: WATAK[`${x.hari} ${x.pasaran}`], sumber: SUMBER_WATAK }];
    }
    case "primbon_jodoh": {
      const x = wetonDariArgs(a.p_hari_1, a.p_pasaran_1, a.p_tanggal_1);
      const y = wetonDariArgs(a.p_hari_2, a.p_pasaran_2, a.p_tanggal_2);
      const j = JODOH[(x.neptu + y.neptu) % 9];
      return [
        { hari_1: x.hari, pasaran_1: x.pasaran, neptu_1: x.neptu, hari_2: y.hari, pasaran_2: y.pasaran, neptu_2: y.neptu, jumlah: x.neptu + y.neptu, sisa: j.sisa, nama: j.nama, arti: j.arti, sumber: SUMBER_JODOH },
      ];
    }
    case "primbon_kapan": {
      const out: Baris[] = [];
      for (let t = dariIso(a.p_mulai!); banding(t, dariIso(a.p_selesai!)) <= 0; t = tambahHari(t, 1)) {
        const x = wetonDari(t);
        if (x.hari === a.p_hari && x.pasaran === a.p_pasaran) out.push({ tanggal: iso(t) });
      }
      return out;
    }
  }
};
