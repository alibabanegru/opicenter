const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace OD block
const oldOd = `                             <div
                              className={cn(
                                "flex",
                                currentMedicalRecord.glassesOrder?.orderType ===
                                  "both"
                                  ? "gap-1"
                                  : "gap-3",
                              )}
                            >
                              <div className="flex-1">
                                <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                  Sph
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    currentMedicalRecord.glassesOrder?.od
                                      ?.sph || ""
                                  }
                                  onChange={(e) =>
                                    updateOrder("od.sph", e.target.value)
                                  }
                                  onBlur={(e) => {
                                    let val = e.target.value.trim();
                                    if (val) {
                                      let num = parseFloat(val);
                                      if (!isNaN(num)) {
                                        num = Math.round(num * 4) / 4;
                                        updateOrder(
                                          "od.sph",
                                          num > 0
                                            ? \`+\${num.toFixed(2)}\`
                                            : num.toFixed(2),
                                        );
                                      }
                                    }
                                  }}
                                  className={cn(
                                    "w-full bg-transparent font-black text-slate-800 dark:text-white outline-none border-b border-transparent focus:border-blue-500",
                                    currentMedicalRecord.glassesOrder
                                      ?.orderType === "both"
                                      ? "text-lg"
                                      : "text-3xl",
                                  )}
                                />
                              </div>
                              <div className="flex-[0.8]">
                                <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                  Cyl
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    currentMedicalRecord.glassesOrder?.od
                                      ?.cyl || ""
                                  }
                                  onChange={(e) =>
                                    updateOrder("od.cyl", e.target.value)
                                  }
                                  onBlur={(e) => {
                                    let val = e.target.value.trim();
                                    if (val) {
                                      let num = parseFloat(val);
                                      if (!isNaN(num)) {
                                        num = Math.round(num * 4) / 4;
                                        updateOrder(
                                          "od.cyl",
                                          num > 0
                                            ? \`+\${num.toFixed(2)}\`
                                            : num.toFixed(2),
                                        );
                                      }
                                    }
                                  }}
                                  className={cn(
                                    "w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-blue-500",
                                    currentMedicalRecord.glassesOrder
                                      ?.orderType === "both"
                                      ? "text-sm"
                                      : "text-2xl",
                                  )}
                                />
                              </div>
                              <div className="flex-[0.6]">
                                <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                  Ax
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max="180"
                                  value={
                                    currentMedicalRecord.glassesOrder?.od
                                      ?.axis || ""
                                  }
                                  onChange={(e) => {
                                    let val = e.target.value;
                                    if (val !== "") {
                                      let num = parseInt(val);
                                      if (num > 180) val = "180";
                                      if (num < 0) val = "0";
                                    }
                                    updateOrder("od.axis", val);
                                  }}
                                  className={cn(
                                    "w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-blue-500",
                                    currentMedicalRecord.glassesOrder
                                      ?.orderType === "both"
                                      ? "text-sm"
                                      : "text-2xl",
                                  )}
                                  placeholder="0"
                                />
                              </div>
                              {currentMedicalRecord.glassesOrder?.orderType !==
                                "near" && (
                                <div className="flex-[0.8] border-l border-blue-100 dark:border-blue-900/50 pl-2 flex flex-col">
                                  <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                    Prismă
                                  </span>
                                  <div className="flex items-end gap-1 mt-auto">
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        value={
                                          currentMedicalRecord.glassesOrder?.od
                                            ?.prism || ""
                                        }
                                        onChange={(e) =>
                                          updateOrder(
                                            "od.prism",
                                            e.target.value,
                                          )
                                        }
                                        className={cn(
                                          "w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-blue-500",
                                          currentMedicalRecord.glassesOrder
                                            ?.orderType === "both"
                                            ? "text-sm"
                                            : "text-xl",
                                        )}
                                        placeholder="pdpt"
                                      />
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <span className="text-[7px] font-black text-blue-500 uppercase leading-none mb-0.5">
                                        BAZA
                                      </span>
                                      <select
                                        value={
                                          currentMedicalRecord.glassesOrder?.od
                                            ?.base || ""
                                        }
                                        onChange={(e) =>
                                          updateOrder("od.base", e.target.value)
                                        }
                                        className={cn(
                                          "bg-transparent font-black text-blue-500 outline-none uppercase",
                                          currentMedicalRecord.glassesOrder
                                            ?.orderType === "both"
                                            ? "w-10 text-[9px]"
                                            : "w-14 text-[10px]",
                                        )}
                                      >
                                        <option value="">-</option>
                                        <option value="NAZAL">N</option>
                                        <option value="TEMPORAL">T</option>
                                        <option value="SUS">S</option>
                                        <option value="JOS">J</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {currentMedicalRecord.glassesOrder?.orderType === "progressive_bifocal" && (
                                <div className="flex-[0.8] border-l border-blue-100 dark:border-blue-900/50 pl-2 flex flex-col">
                                  <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                    Adiție (ADD)
                                  </span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={
                                      currentMedicalRecord.glassesOrder?.od
                                        ?.add || ""
                                    }
                                    onChange={(e) =>
                                      updateOrder("od.add", e.target.value)
                                    }
                                    onBlur={(e) => {
                                      let val = e.target.value.trim();
                                      if (val) {
                                        let num = parseFloat(val);
                                        if (!isNaN(num)) {
                                          num = Math.round(num * 4) / 4;
                                          updateOrder(
                                            "od.add",
                                            num > 0
                                              ? \`+\${num.toFixed(2)}\`
                                              : num.toFixed(2),
                                          );
                                        }
                                      }
                                    }}
                                    className="w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-blue-500 text-2xl mt-auto"
                                    placeholder="Ex: +2.00"
                                  />
                                </div>
                              )}
                            </div>`;

const newOd = `                             <div
                              className={cn(
                                "flex",
                                currentMedicalRecord.glassesOrder?.orderType ===
                                  "both"
                                  ? "gap-1"
                                  : "gap-1.5",
                              )}
                            >
                              <div className="flex-[0.85]">
                                <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                  Sph
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    currentMedicalRecord.glassesOrder?.od
                                      ?.sph || ""
                                  }
                                  onChange={(e) =>
                                    updateOrder("od.sph", e.target.value)
                                  }
                                  onBlur={(e) => {
                                    let val = e.target.value.trim();
                                    if (val) {
                                      let num = parseFloat(val);
                                      if (!isNaN(num)) {
                                        num = Math.round(num * 4) / 4;
                                        updateOrder(
                                          "od.sph",
                                          num > 0
                                            ? \`+\${num.toFixed(2)}\`
                                            : num.toFixed(2),
                                        );
                                      }
                                    }
                                  }}
                                  className={cn(
                                    "w-full bg-transparent font-black text-slate-800 dark:text-white outline-none border-b border-transparent focus:border-blue-500",
                                    currentMedicalRecord.glassesOrder
                                      ?.orderType === "both"
                                      ? "text-lg"
                                      : "text-3xl",
                                  )}
                                />
                              </div>
                              <div className="flex-[0.75]">
                                <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                  Cyl
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    currentMedicalRecord.glassesOrder?.od
                                      ?.cyl || ""
                                  }
                                  onChange={(e) =>
                                    updateOrder("od.cyl", e.target.value)
                                  }
                                  onBlur={(e) => {
                                    let val = e.target.value.trim();
                                    if (val) {
                                      let num = parseFloat(val);
                                      if (!isNaN(num)) {
                                        num = Math.round(num * 4) / 4;
                                        updateOrder(
                                          "od.cyl",
                                          num > 0
                                            ? \`+\${num.toFixed(2)}\`
                                            : num.toFixed(2),
                                        );
                                      }
                                    }
                                  }}
                                  className={cn(
                                    "w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-blue-500",
                                    currentMedicalRecord.glassesOrder
                                      ?.orderType === "both"
                                      ? "text-sm"
                                      : "text-2xl",
                                  )}
                                />
                              </div>
                              <div className="flex-[0.5]">
                                <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                  Ax
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max="180"
                                  value={
                                    currentMedicalRecord.glassesOrder?.od
                                      ?.axis || ""
                                  }
                                  onChange={(e) => {
                                    let val = e.target.value;
                                    if (val !== "") {
                                      let num = parseInt(val);
                                      if (num > 180) val = "180";
                                      if (num < 0) val = "0";
                                    }
                                    updateOrder("od.axis", val);
                                  }}
                                  className={cn(
                                    "w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-blue-500",
                                    currentMedicalRecord.glassesOrder
                                      ?.orderType === "both"
                                      ? "text-sm"
                                      : "text-2xl",
                                  )}
                                  placeholder="0"
                                />
                              </div>
                              {currentMedicalRecord.glassesOrder?.orderType !==
                                "near" && (
                                <div className="flex-[0.75] border-l border-blue-100 dark:border-blue-900/50 pl-1.5 flex flex-col">
                                  <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                    Prismă
                                  </span>
                                  <div className="flex items-end gap-1 mt-auto">
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        value={
                                          currentMedicalRecord.glassesOrder?.od
                                            ?.prism || ""
                                        }
                                        onChange={(e) =>
                                          updateOrder(
                                            "od.prism",
                                            e.target.value,
                                          )
                                        }
                                        className={cn(
                                          "w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-blue-500",
                                          currentMedicalRecord.glassesOrder
                                            ?.orderType === "both"
                                            ? "text-sm"
                                            : "text-xl",
                                        )}
                                        placeholder="pdpt"
                                      />
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <span className="text-[7px] font-black text-blue-500 uppercase leading-none mb-0.5">
                                        BAZA
                                      </span>
                                      <select
                                        value={
                                          currentMedicalRecord.glassesOrder?.od
                                            ?.base || ""
                                        }
                                        onChange={(e) =>
                                          updateOrder("od.base", e.target.value)
                                        }
                                        className={cn(
                                          "bg-transparent font-black text-blue-500 outline-none uppercase",
                                          currentMedicalRecord.glassesOrder
                                            ?.orderType === "both"
                                            ? "w-10 text-[9px]"
                                            : "w-14 text-[10px]",
                                        )}
                                      >
                                        <option value="">-</option>
                                        <option value="NAZAL">N</option>
                                        <option value="TEMPORAL">T</option>
                                        <option value="SUS">S</option>
                                        <option value="JOS">J</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {currentMedicalRecord.glassesOrder?.orderType === "progressive_bifocal" && (
                                <div className="flex-[1.1] border-l border-blue-100 dark:border-blue-900/50 pl-1.5 flex flex-col">
                                  <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 block uppercase leading-none mb-0.5">
                                    Adiție (ADD)
                                  </span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={
                                      currentMedicalRecord.glassesOrder?.od
                                        ?.add || ""
                                    }
                                    onChange={(e) =>
                                      updateOrder("od.add", e.target.value)
                                    }
                                    onBlur={(e) => {
                                      let val = e.target.value.trim();
                                      if (val) {
                                        let num = parseFloat(val);
                                        if (!isNaN(num)) {
                                          num = Math.round(num * 4) / 4;
                                          updateOrder(
                                            "od.add",
                                            num > 0
                                              ? \`+\${num.toFixed(2)}\`
                                              : num.toFixed(2),
                                          );
                                        }
                                      }
                                    }}
                                    className={cn(
                                      "w-full bg-transparent font-black text-slate-800 dark:text-white outline-none border-b border-transparent focus:border-blue-500 mt-auto",
                                      currentMedicalRecord.glassesOrder?.orderType === "both"
                                        ? "text-lg"
                                        : "text-3xl",
                                    )}
                                    placeholder="Ex: +2.00"
                                  />
                                </div>
                              )}
                            </div>`;

// Replace OS block
const oldOs = `                             <div
                              className={cn(
                                "flex",
                                currentMedicalRecord.glassesOrder?.orderType ===
                                  "both"
                                  ? "gap-1"
                                  : "gap-3",
                              )}
                            >
                              <div className="flex-1">
                                <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                  Sph
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    currentMedicalRecord.glassesOrder?.os
                                      ?.sph || ""
                                  }
                                  onChange={(e) =>
                                    updateOrder("os.sph", e.target.value)
                                  }
                                  onBlur={(e) => {
                                    let val = e.target.value.trim();
                                    if (val) {
                                      let num = parseFloat(val);
                                      if (!isNaN(num)) {
                                        num = Math.round(num * 4) / 4;
                                        updateOrder(
                                          "os.sph",
                                          num > 0
                                            ? \`+\${num.toFixed(2)}\`
                                            : num.toFixed(2),
                                        );
                                      }
                                    }
                                  }}
                                  className={cn(
                                    "w-full bg-transparent font-black text-slate-800 dark:text-white outline-none border-b border-transparent focus:border-blue-500",
                                    currentMedicalRecord.glassesOrder
                                      ?.orderType === "both"
                                      ? "text-lg"
                                      : "text-3xl",
                                  )}
                                />
                              </div>
                              <div className="flex-[0.8]">
                                <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                  Cyl
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    currentMedicalRecord.glassesOrder?.os
                                      ?.cyl || ""
                                  }
                                  onChange={(e) =>
                                    updateOrder("os.cyl", e.target.value)
                                  }
                                  onBlur={(e) => {
                                    let val = e.target.value.trim();
                                    if (val) {
                                      let num = parseFloat(val);
                                      if (!isNaN(num)) {
                                        num = Math.round(num * 4) / 4;
                                        updateOrder(
                                          "os.cyl",
                                          num > 0
                                            ? \`+\${num.toFixed(2)}\`
                                            : num.toFixed(2),
                                        );
                                      }
                                    }
                                  }}
                                  className={cn(
                                    "w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-blue-500",
                                    currentMedicalRecord.glassesOrder
                                      ?.orderType === "both"
                                      ? "text-sm"
                                      : "text-2xl",
                                  )}
                                />
                              </div>
                              <div className="flex-[0.6]">
                                <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                  Ax
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max="180"
                                  value={
                                    currentMedicalRecord.glassesOrder?.os
                                      ?.axis || ""
                                  }
                                  onChange={(e) => {
                                    let val = e.target.value;
                                    if (val !== "") {
                                      let num = parseInt(val);
                                      if (num > 180) val = "180";
                                      if (num < 0) val = "0";
                                    }
                                    updateOrder("os.axis", val);
                                  }}
                                  className={cn(
                                    "w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-blue-500",
                                    currentMedicalRecord.glassesOrder
                                      ?.orderType === "both"
                                      ? "text-sm"
                                      : "text-2xl",
                                  )}
                                  placeholder="0"
                                />
                              </div>
                              {currentMedicalRecord.glassesOrder?.orderType !==
                                "near" && (
                                <div className="flex-[0.8] border-l border-blue-100 dark:border-blue-900/50 pl-2 flex flex-col">
                                  <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                    Prismă
                                  </span>
                                  <div className="flex items-end gap-1 mt-auto">
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        value={
                                          currentMedicalRecord.glassesOrder?.os
                                            ?.prism || ""
                                        }
                                        onChange={(e) =>
                                          updateOrder(
                                            "os.prism",
                                            e.target.value,
                                          )
                                        }
                                        className={cn(
                                          "w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-blue-500",
                                          currentMedicalRecord.glassesOrder
                                            ?.orderType === "both"
                                            ? "text-sm"
                                            : "text-xl",
                                        )}
                                        placeholder="pdpt"
                                      />
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <span className="text-[7px] font-black text-blue-500 uppercase leading-none mb-0.5">
                                        BAZA
                                      </span>
                                      <select
                                        value={
                                          currentMedicalRecord.glassesOrder?.os
                                            ?.base || ""
                                        }
                                        onChange={(e) =>
                                          updateOrder("os.base", e.target.value)
                                        }
                                        className={cn(
                                          "bg-transparent font-black text-blue-500 outline-none uppercase",
                                          currentMedicalRecord.glassesOrder
                                            ?.orderType === "both"
                                            ? "w-10 text-[9px]"
                                            : "w-14 text-[10px]",
                                        )}
                                      >
                                        <option value="">-</option>
                                        <option value="NAZAL">N</option>
                                        <option value="TEMPORAL">T</option>
                                        <option value="SUS">S</option>
                                        <option value="JOS">J</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {currentMedicalRecord.glassesOrder?.orderType === "progressive_bifocal" && (
                                <div className="flex-[0.8] border-l border-blue-100 dark:border-blue-900/50 pl-2 flex flex-col">
                                  <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                    Adiție (ADD)
                                  </span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={
                                      currentMedicalRecord.glassesOrder?.os
                                        ?.add || ""
                                    }
                                    onChange={(e) =>
                                      updateOrder("os.add", e.target.value)
                                    }
                                    onBlur={(e) => {
                                      let val = e.target.value.trim();
                                      if (val) {
                                        let num = parseFloat(val);
                                        if (!isNaN(num)) {
                                          num = Math.round(num * 4) / 4;
                                          updateOrder(
                                            "os.add",
                                            num > 0
                                              ? \`+\${num.toFixed(2)}\`
                                              : num.toFixed(2),
                                          );
                                        }
                                      }
                                    }}
                                    className="w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-blue-500 text-2xl mt-auto"
                                    placeholder="Ex: +2.00"
                                  />
                                </div>
                              )}
                            </div>`;

const newOs = `                             <div
                              className={cn(
                                "flex",
                                currentMedicalRecord.glassesOrder?.orderType ===
                                  "both"
                                  ? "gap-1"
                                  : "gap-1.5",
                              )}
                            >
                              <div className="flex-[0.85]">
                                <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                  Sph
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    currentMedicalRecord.glassesOrder?.os
                                      ?.sph || ""
                                  }
                                  onChange={(e) =>
                                    updateOrder("os.sph", e.target.value)
                                  }
                                  onBlur={(e) => {
                                    let val = e.target.value.trim();
                                    if (val) {
                                      let num = parseFloat(val);
                                      if (!isNaN(num)) {
                                        num = Math.round(num * 4) / 4;
                                        updateOrder(
                                          "os.sph",
                                          num > 0
                                            ? \`+\${num.toFixed(2)}\`
                                            : num.toFixed(2),
                                        );
                                      }
                                    }
                                  }}
                                  className={cn(
                                    "w-full bg-transparent font-black text-slate-800 dark:text-white outline-none border-b border-transparent focus:border-blue-500",
                                    currentMedicalRecord.glassesOrder
                                      ?.orderType === "both"
                                      ? "text-lg"
                                      : "text-3xl",
                                  )}
                                />
                              </div>
                              <div className="flex-[0.75]">
                                <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                  Cyl
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    currentMedicalRecord.glassesOrder?.os
                                      ?.cyl || ""
                                  }
                                  onChange={(e) =>
                                    updateOrder("os.cyl", e.target.value)
                                  }
                                  onBlur={(e) => {
                                    let val = e.target.value.trim();
                                    if (val) {
                                      let num = parseFloat(val);
                                      if (!isNaN(num)) {
                                        num = Math.round(num * 4) / 4;
                                        updateOrder(
                                          "os.cyl",
                                          num > 0
                                            ? \`+\${num.toFixed(2)}\`
                                            : num.toFixed(2),
                                        );
                                      }
                                    }
                                  }}
                                  className={cn(
                                    "w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-blue-500",
                                    currentMedicalRecord.glassesOrder
                                      ?.orderType === "both"
                                      ? "text-sm"
                                      : "text-2xl",
                                  )}
                                />
                              </div>
                              <div className="flex-[0.5]">
                                <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                  Ax
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max="180"
                                  value={
                                    currentMedicalRecord.glassesOrder?.os
                                      ?.axis || ""
                                  }
                                  onChange={(e) => {
                                    let val = e.target.value;
                                    if (val !== "") {
                                      let num = parseInt(val);
                                      if (num > 180) val = "180";
                                      if (num < 0) val = "0";
                                    }
                                    updateOrder("os.axis", val);
                                  }}
                                  className={cn(
                                    "w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-blue-500",
                                    currentMedicalRecord.glassesOrder
                                      ?.orderType === "both"
                                      ? "text-sm"
                                      : "text-2xl",
                                  )}
                                  placeholder="0"
                                />
                              </div>
                              {currentMedicalRecord.glassesOrder?.orderType !==
                                "near" && (
                                <div className="flex-[0.75] border-l border-blue-100 dark:border-blue-900/50 pl-1.5 flex flex-col">
                                  <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                    Prismă
                                  </span>
                                  <div className="flex items-end gap-1 mt-auto">
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        value={
                                          currentMedicalRecord.glassesOrder?.os
                                            ?.prism || ""
                                        }
                                        onChange={(e) =>
                                          updateOrder(
                                            "os.prism",
                                            e.target.value,
                                          )
                                        }
                                        className={cn(
                                          "w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-blue-500",
                                          currentMedicalRecord.glassesOrder
                                            ?.orderType === "both"
                                            ? "text-sm"
                                            : "text-xl",
                                        )}
                                        placeholder="pdpt"
                                      />
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <span className="text-[7px] font-black text-blue-500 uppercase leading-none mb-0.5">
                                        BAZA
                                      </span>
                                      <select
                                        value={
                                          currentMedicalRecord.glassesOrder?.os
                                            ?.base || ""
                                        }
                                        onChange={(e) =>
                                          updateOrder("os.base", e.target.value)
                                        }
                                        className={cn(
                                          "bg-transparent font-black text-blue-500 outline-none uppercase",
                                          currentMedicalRecord.glassesOrder
                                            ?.orderType === "both"
                                            ? "w-10 text-[9px]"
                                            : "w-14 text-[10px]",
                                        )}
                                      >
                                        <option value="">-</option>
                                        <option value="NAZAL">N</option>
                                        <option value="TEMPORAL">T</option>
                                        <option value="SUS">S</option>
                                        <option value="JOS">J</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {currentMedicalRecord.glassesOrder?.orderType === "progressive_bifocal" && (
                                <div className="flex-[1.1] border-l border-blue-100 dark:border-blue-900/50 pl-1.5 flex flex-col">
                                  <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 block uppercase leading-none mb-0.5">
                                    Adiție (ADD)
                                  </span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={
                                      currentMedicalRecord.glassesOrder?.os
                                        ?.add || ""
                                    }
                                    onChange={(e) =>
                                      updateOrder("os.add", e.target.value)
                                    }
                                    onBlur={(e) => {
                                      let val = e.target.value.trim();
                                      if (val) {
                                        let num = parseFloat(val);
                                        if (!isNaN(num)) {
                                          num = Math.round(num * 4) / 4;
                                          updateOrder(
                                            "os.add",
                                            num > 0
                                              ? \`+\${num.toFixed(2)}\`
                                              : num.toFixed(2),
                                          );
                                        }
                                      }
                                    }}
                                    className={cn(
                                      "w-full bg-transparent font-black text-slate-800 dark:text-white outline-none border-b border-transparent focus:border-blue-500 mt-auto",
                                      currentMedicalRecord.glassesOrder?.orderType === "both"
                                        ? "text-lg"
                                        : "text-3xl",
                                    )}
                                    placeholder="Ex: +2.00"
                                  />
                                </div>
                              )}
                            </div>`;

console.log('OD found:', content.includes(oldOd));
console.log('OS found:', content.includes(oldOs));

if (content.includes(oldOd) && content.includes(oldOs)) {
  content = content.replace(oldOd, newOd);
  content = content.replace(oldOs, newOs);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('Successfully updated Glasses Order layout in src/App.tsx!');
} else {
  console.error('Failed to match OD or OS block exactly.');
}
