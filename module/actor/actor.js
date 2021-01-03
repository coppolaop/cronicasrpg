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

  }

  /**
   * Calculate Character attributes according to his actual points and penalities
   */
  _evaluateAttributes() {
    const data = this.data.data;
    for (let [key, atributo] of Object.entries(data.atributos)) {
      atributo.total = atributo.valor - data.penalidades.ferimento - data.penalidades.hesitacao - data.penalidades.frustracao;
      for (let [key, especializacao] of Object.entries(atributo.especializacoes)) {
        especializacao.total = especializacao.valor + atributo.total;
      }
    }
  }

  /**
   * Prepare Character combat status according to his actual points and penalities
   */
  _evaluateCombatStatus() {

  }

}