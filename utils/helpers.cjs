exports.cleanPrice = (txt) => {
  if (!txt) return null;

  txt = txt.toLowerCase();

  if (txt.includes("free")) return 0;

  txt = txt.replace(/[^\d.,]/g, "").replace(",", ".");

  const num = parseFloat(txt);
  return isNaN(num) ? null : num;
};
