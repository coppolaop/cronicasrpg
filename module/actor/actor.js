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

    if (game.settings.get("cronicasrpg", "autoCalcCmb")) {
      this._evaluateCombatStatus();
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
    const data = this.data.data;
    //Fisico
    data.combate.fisico.iniciativa = data.atributos[data.combate.escolha].valor - data.penalidades.ferimento;
    data.combate.fisico.defesa = Math.trunc((data.atributos.agilidade.valor + data.atributos.manejo.valor) / 3);
    //data.combate.fisico.absorcao = armadura;
    data.combate.fisico.vigor = data.atributos.resistencia.valor;
    //Mental
    data.combate.mental.iniciativa = data.atributos.inteligencia.valor - data.penalidades.frustracao;
    data.combate.mental.defesa = Math.trunc((data.atributos.inteligencia.valor + data.atributos.conhecimento.valor) / 3);
    data.combate.mental.absorcao = data.atributos.conhecimento.valor
    data.combate.mental.vigor = data.atributos.vontade.valor;
    //Social
    data.combate.social.iniciativa = data.atributos.labia.valor - data.penalidades.hesitacao;
    data.combate.social.defesa = Math.trunc((data.atributos.blefe.valor + data.atributos.labia.valor) / 3);
    data.combate.social.absorcao = data.pontos.status;
    data.combate.social.vigor = data.atributos.lideranca.valor;
  }

}