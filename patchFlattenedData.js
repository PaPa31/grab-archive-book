(function patchFlattenedData() {
  const br = window.BookReader || window.br;

  if (!br || !br._getDataFlattened) {
    console.warn("❌ BookReader instance not found or method missing.");
    return;
  }

  // Patch the method to force all pages as viewable
  br._getDataFlattened = function() {
    let i = null;
    let r = null;
    let o = 0;

    const flat = this.br.data.flatMap(p =>
      p.map(_ => {
        // Force visibility
        _.viewable = true;
        delete _.unviewablesStart;

        // Reconstruct pageSide logic
        _.pageSide = _.pageSide || (i === null ? (p.length === 2 ? "L" : "R") : i === "L" ? "R" : "L");
        i = _.pageSide;
        o++;
        return _;
      })
    );

    // Update the cache with our new fully viewable array
    return this._getDataFlattenedCached = [flat, this.br.data.length], flat;
  };

  // Optional: force a reload from page 0 to apply the patch
  try {
    br.currentIndex = 0;
    br.showPage(0);
    console.log("✅ Patch applied, starting from page 0.");
  } catch (e) {
    console.warn("⚠️ Patch applied, but could not restart viewer:", e);
  }
})();

