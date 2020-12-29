
/*Class to configure system settings*/
export const SystemSettings = function () {
  /**
   * Automatic spend of actions
   */
  game.settings.register("cronicasrpg", "automaticActionSpend", {
    name: "Gasto de Ações",
    hint: "Ao agir o personagem gasta ações do seu turno automaticamente.",
    scope: "world",
    config: true,
    default: false,
    type: Boolean
  });

  /**
   * Register diagonal movement rule setting
   */
  game.settings.register("cronicasrpg", "diagonalMovement", {
    name: "Movimento Diagonal",
    hint: "Configura qual regra de movimento diagonal será usada no sistema.",
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
   * Option to disable initiative roll after end of turn.
   */
  game.settings.register("cronicasrpg", "autoRoll", {
    name: "Rolagem automática de iniciativa",
    hint: "Ao invés de utilizar rolagem manual de iniciativa, o sistema rola automaticamente as iniciativas no inicio de cada turno.",
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
  });

}
