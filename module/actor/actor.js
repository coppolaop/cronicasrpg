/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class CronicasActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    this._evaluateAttributes();

    if (game.settings.get("cronicasrpg", "autoCalcExp")) {
      this._evaluateExperience();
    }

  }

  /**
   * Calculate Character attributes according to his actual points and penalities
   */
  _evaluateAttributes() {
    const data = this.data.data;
    for (let [key, atributo] of Object.entries(data.atributos)) {
      atributo.total = atributo.valor + atributo.outros - data.penalidades.ferimento - data.penalidades.hesitacao - data.penalidades.frustracao;
      for (let [key, especializacao] of Object.entries(atributo.especializacoes)) {
        especializacao.total = especializacao.valor + especializacao.outros + atributo.total;
      }
    }
  }

  /**
   * Calculate Character spent experience according to his actual attributes and specializations spent points
   */
  _evaluateExperience() {
    const data = this.data.data;
    data.pontos.experiencia.gasta = 0;
    for (let [key, atributo] of Object.entries(data.atributos)) {
      data.pontos.experiencia.gasta += ((atributo.valor - 2) * 30);
      for (let [key, especializacao] of Object.entries(atributo.especializacoes)) {
        data.pontos.experiencia.gasta += (especializacao.valor * 10);
      }
    }
    data.pontos.experiencia.resto = data.pontos.experiencia.valor - data.pontos.experiencia.gasta;
  }

  /**
   * Prepare Character combat status according to his actual points and penalities
   */
  _evaluateCombatStatus() {

  }

}