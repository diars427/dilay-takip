/* YKS Dilay Takip - ayarlar. Supabase projesi kurulunca bu iki satır doldurulur.
   Bu anahtar "herkese açık" (publishable / anon) anahtardır; şifre değildir. Verileri koruyan şey
   veritabanındaki erişim kurallarıdır: sadece listedeki iki e-posta (Dilay ve koç) girebilir. */
window.DT_AYAR = {
  SUPABASE_URL: 'https://rmtbjjtmsrccmgfuncmx.supabase.co',
  SUPABASE_KEY: 'sb_publishable_zgInqFuFvFFrGoYeT7vKKw_l0ejsFKL',
  KULLANICI_ALANI: 'dilaytakip.local',   // kullanici adi 'kisi1' -> kisi1@dilaytakip.local (gercek e-posta degil)
  programBaslangic: '2026-11-12',
  sinavTYT: '2027-06-19',
  sinavAYT: '2027-06-20',
  // gunluk 12 pomodoronun baslangic saatleri (her gun ayni, 45 dk)
  pomSaat: ['03:15', '04:15', '05:15', '07:45', '08:45', '09:45', '12:15', '13:15', '14:15', '16:45', '17:45', '18:45']
};
