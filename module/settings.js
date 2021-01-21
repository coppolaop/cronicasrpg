
/*Class to configure system settings*/
export const SystemSettings = function () {

  /**
   * Register diagonal movement rule setting
   */
  game.settings.register("cronicasrpg", "diagonalMovement", {
    name: game.i18n.localize("cronicasrpg.settings.diagonalMovement.name"),
    hint: game.i18n.localize("cronicasrpg.settings.diagonalMovement.hint"),
    scope: "world",
    config: true,
    default: "MANHATTAN",
    type: String,
    choices: {
      "MANHATTAN": "Padrão (3m)",
      "EQUIDISTANT": "Equidistante (1,5m)",
      "PATHFINDER": "Pathfinder/3.5 (1,5m/3m/1,5m)",
    },
    onChange: rule => canvas.grid.diagonalRule = rule
  });

  /**
   * Automatic spend of actions
   */
  game.settings.register("cronicasrpg", "automaticActionSpend", {
    name: game.i18n.localize("cronicasrpg.settings.automaticActionSpend.name"),
    hint: game.i18n.localize("cronicasrpg.settings.automaticActionSpend.hint"),
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });

  /**
   * Option to disable initiative roll after end of turn.
   */
  game.settings.register("cronicasrpg", "autoRoll", {
    name: game.i18n.localize("cronicasrpg.settings.autoroll.name"),
    hint: game.i18n.localize("cronicasrpg.settings.autoroll.hint"),
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
  });

  /**
   * Option to disable automatic calculation of spent experience.
   */
  game.settings.register("cronicasrpg", "autoCalcExp", {
    name: game.i18n.localize("cronicasrpg.settings.autoCalcExp.name"),
    hint: game.i18n.localize("cronicasrpg.settings.autoCalcExp.hint"),
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
  });

  /**
   * Option to disable automatic calculation of Combat stats.
   */
  game.settings.register("cronicasrpg", "autoCalcCmb", {
    name: game.i18n.localize("cronicasrpg.settings.autoCalcCmb.name"),
    hint: game.i18n.localize("cronicasrpg.settings.autoCalcCmb.hint"),
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
  });

}
