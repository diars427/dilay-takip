/* YKS Dilay Takip - ayarlar. Supabase projesi kurulunca bu iki satır doldurulur.
   Bu anahtar "herkese açık" (publishable / anon) anahtardır; şifre değildir. Verileri koruyan şey
   veritabanındaki erişim kurallarıdır: sadece listedeki iki e-posta (Dilay ve koç) girebilir. */
window.DT_AYAR = {
  SUPABASE_URL: 'https://rmtbjjtmsrccmgfuncmx.supabase.co',
  SUPABASE_KEY: 'sb_publishable_zgInqFuFvFFrGoYeT7vKKw_l0ejsFKL',
  KULLANICI_ALANI: 'dilaytakip.local',   // kullanici adi 'kisi1' -> kisi1@dilaytakip.local (gercek e-posta degil)
  programBaslangic: '2026-11-30',
  sinavTYT: '2027-06-19',
  sinavAYT: '2027-06-20',
  // gunluk 12 pomodoronun baslangic saatleri (her gun ayni, 45 dk)
  pomSaat: ['03:15', '04:15', '05:15', '07:45', '08:45', '09:45', '12:15', '13:15', '14:15', '16:45', '17:45', '18:45'],
  // 30 Kasim 2026 Pazartesiden itibaren Pzt-Cmt (00:00 kalkis, 18:00 yatis). Pazar yukaridaki saatlerde kalir
  pomYeniBas: '2026-11-30',
  pomSaatYeni: ['00:15', '01:15', '02:15', '04:45', '05:45', '06:45', '09:15', '10:15', '11:15', '13:45', '14:45', '15:45']
};
