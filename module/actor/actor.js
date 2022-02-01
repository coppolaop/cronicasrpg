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
    this._evaluateMovement();

    if (game.settings.get("cronicasrpg", "autoCalcExp")) {
      this._evaluateExperience();
    }

    if (game.settings.get("cronicasrpg", "autoCalcCmb")) {
      this._evaluateCombatStatus();
    }

    if (game.settings.get("cronicasrpg", "autoCalcPen")) {
      this._evaluatePenalties();
    }
  }

  /**
   * Calculate Character attributes according to his actual points and penalities
   */
  _evaluateAttributes() {
    const data = this.data.data;
    let penalidadeArmadura = 0;

    this.data.items.forEach(item => {
      if (item.type == "armadura" && item.data.data.equipada) {
        penalidadeArmadura = item.data.data.penalidade;
      }
    })

    for (let [key, atributo] of Object.entries(data.atributos)) {
      atributo.total = atributo.valor + atributo.outros - data.penalidades.ferimento - data.penalidades.hesitacao - data.penalidades.frustracao;
      if (key == "agilidade" || key == "forca" || key == "furtividade") {
        atributo.total -= penalidadeArmadura;
      }
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
    let armadura = 0;
    let defesaArma = 0;
    let incrementoVigorFisico = 0;
    let incrementoVigorMental = 0;
    let incrementoVigorSocial = 0;

    this.data.items.forEach(item => {
      if (item.data.type == "armadura" && item.data.data.equipada && (armadura < item.data.data.absorcao)) {
        armadura = item.data.data.absorcao;
      }

      if (item.data.data.defensiva && !item.data.data.guardado && (defesaArma < item.data.data.defensivaValor)) {
        defesaArma = item.data.data.defensivaValor;
      }

      if (item.data.data.aumentoVigor == "fisico") {
        incrementoVigorFisico += item.data.data.aumentoVigorValor
      }
      else if (item.data.data.aumentoVigor == "mental") {
        incrementoVigorMental += item.data.data.aumentoVigorValor
      }
      else if (item.data.data.aumentoVigor == "social") {
        incrementoVigorSocial += item.data.data.aumentoVigorValor
      }
    });

    //Fisico
    data.combate.fisico.iniciativa = data.atributos[data.combate.escolha].valor - data.penalidades.ferimento;
    data.combate.fisico.defesa = Math.trunc((data.atributos.agilidade.valor + data.atributos.manejo.valor) / 3) + defesaArma;
    data.combate.fisico.absorcao = armadura;
    data.combate.fisico.vigor = data.atributos.resistencia.valor + incrementoVigorFisico;
    //Mental
    data.combate.mental.iniciativa = data.atributos.inteligencia.valor - data.penalidades.frustracao;
    data.combate.mental.defesa = Math.trunc((data.atributos.inteligencia.valor + data.atributos.conhecimento.valor) / 3);
    data.combate.mental.absorcao = data.atributos.conhecimento.valor
    data.combate.mental.vigor = data.atributos.vontade.valor + incrementoVigorMental;
    //Social
    data.combate.social.iniciativa = data.atributos.labia.valor - data.penalidades.hesitacao;
    data.combate.social.defesa = Math.trunc((data.atributos.blefe.valor + data.atributos.labia.valor) / 3);
    data.combate.social.absorcao = data.pontos.status;
    data.combate.social.vigor = data.atributos.lideranca.valor + incrementoVigorSocial;
  }

  /**
   * Prepare Character penalties according to his actual vigor
   */
  _evaluatePenalties() {
    const data = this.data.data;
    //Fisico (ferimento)
    let calculoVigor = (data.combate.fisico.vigor * 3) / ((data.combate.fisico.vigor * 2) + data.combate.fisico.vigorAtual);
    if (calculoVigor < 0 || calculoVigor == Infinity) {
      data.penalidades.ferimento = 3;
    } else if (calculoVigor < 1.5) {
      data.penalidades.ferimento = 0;
    } else if (calculoVigor < 3) {
      data.penalidades.ferimento = 1;
    } else {
      data.penalidades.ferimento = 2;
    }
    //Mental (frustracao)
    calculoVigor = (data.combate.mental.vigor * 3) / ((data.combate.mental.vigor * 2) + data.combate.mental.vigorAtual);
    if (calculoVigor < 0 || calculoVigor == Infinity) {
      data.penalidades.frustracao = 3;
    } else if (calculoVigor < 1.5) {
      data.penalidades.frustracao = 0;
    } else if (calculoVigor < 3) {
      data.penalidades.frustracao = 1;
    } else {
      data.penalidades.frustracao = 2;
    }
    //Social (hesitacao)
    calculoVigor = (data.combate.social.vigor * 3) / ((data.combate.social.vigor * 2) + data.combate.social.vigorAtual);
    if (calculoVigor < 0 || calculoVigor == Infinity) {
      data.penalidades.hesitacao = 3;
    } else if (calculoVigor < 1.5) {
      data.penalidades.hesitacao = 0;
    } else if (calculoVigor < 3) {
      data.penalidades.hesitacao = 1;
    } else {
      data.penalidades.hesitacao = 2;
    }
  }

  /**
   * Calculate Character movement according to his penalities
   */
  _evaluateMovement() {
    const data = this.data.data;

    let fardo = 0;
    let penalidade = 0;

    this.data.items.forEach(item => {
      let itemData = item.data.data;
      if (item.type == "armadura" && itemData.equipada) {
        penalidade = itemData.penalidade;
      }
      if (itemData.fardo && !itemData.guardado) {
        fardo++;
      }
    });

    if (fardo > penalidade) {
      penalidade = fardo;
    }

    data.movimentacao.base = Number(game.settings.get("cronicasrpg", "baseMovement"));
    data.movimentacao.penalidade = penalidade;
    data.movimentacao.total = data.movimentacao.base + data.movimentacao.outros - penalidade;
  }
}