(function patchFlattenedData() {
  const br = window.BookReader || window.br;

  if (!br || typeof br._getDataFlattened !== 'function') {
    console.warn("❌ BookReader instance not found or method missing.");
    return;
  }

  console.log("🔧 Patching _getDataFlattened");

  const original = br._getDataFlattened.bind(br);

  br._getDataFlattened = function () {
    let i = null;
    let o = 0;

    const flat = this.br.data.flatMap(p =>
      p.map(page => {
        page.viewable = true;
        delete page.unviewablesStart;

        page.pageSide = page.pageSide || (i === null ? (p.length === 2 ? "L" : "R") : i === "L" ? "R" : "L");
        i = page.pageSide;
        o++;
        return page;
      })
    );

    this._getDataFlattenedCached = [flat, this.br.data.length];
    return flat;
  };

  try {
    br.currentIndex = 0;
    br.showPage(0);
    console.log("✅ Patch applied and viewer restarted from page 0.");
  } catch (e) {
    console.warn("⚠️ Patch applied, but could not restart viewer:", e);
  }
})();
