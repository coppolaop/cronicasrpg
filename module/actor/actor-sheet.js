import { cronicasrpg } from '../config.js'
import { prepRoll } from "../dice.js";
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class CronicasActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["cronicasrpg", "sheet", "actor"],
      template: "systems/cronicasrpg/templates/actor/actor-sheet.html",
      width: 600,
      height: 650,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "descricao" }]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData(options) {
    const data = super.getData(options);
    data.dtypes = ["String", "Number", "Boolean"];
    for (let attr of Object.values(data.data.system.atributos)) {
      attr.isCheckbox = attr.dtype == "Boolean";
    }
    for (let [key, atributo] of Object.entries(data.data.system.atributos)) {
      for (let [key, especializacao] of Object.entries(atributo.especializacoes)) {
        especializacao.label = game.i18n.localize(cronicasrpg.attributes[key]);
      }
      atributo.label = game.i18n.localize(cronicasrpg.attributes[key]);
    }

    // Prepare items.
    if (this.actor.type == 'character') {
      this._prepareCharacterItems(data);
    }

    return data;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData) {
    const actorData = sheetData.actor;

    // Initialize containers.
    const virtudes = [];
    const fraquezas = [];
    const posses = [];
    const armas = [];
    const armaduras = [];

    // Iterate through items, allocating to containers
    for (let i of sheetData.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Append to virtues.
      if (i.type == 'virtude') {
        virtudes.push(i);
      }
      // Append to weakness.
      if (i.type == 'fraqueza') {
        fraquezas.push(i);
      }
      // Append to goods.
      if (i.type == 'posse') {
        posses.push(i);
      }
      // Append to weapons.
      if (i.type == 'arma') {
        var array = i.system.especializacaoAcerto.split(".");
        i.acerto = actorData.system.atributos[array[0]][array[1]][array[2]].total;
        armas.push(i);
      }
      // Append to armor.
      if (i.type == 'armadura') {
        armaduras.push(i);
      }
    }

    // Assign and return
    actorData.virtudes = virtudes;
    actorData.fraquezas = fraquezas;
    actorData.posses = posses;
    actorData.armas = armas;
    actorData.armaduras = armaduras;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    const data = this.getData().data.system;
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Update Inventory Item
    html.find('.toggle-equipped').click(this._onToggleEquipped.bind(this));
    html.find('.toggle-carried').click(this._onToggleCarried.bind(this));


    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      if (item) return item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }


    for (let [key, atributo] of Object.entries(data.atributos)) {
      if (localStorage.getItem('accordion-' + key) == 'true') {
        html.find('#accordion-' + key).click();
      }
      html.on('keyup keypress', function (e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode == 13 && e.target.type != "textarea") {
          e.preventDefault();
        }
      });
      html.find('#accordion-' + key).on('click', function () {
        if (localStorage.getItem('accordion-' + key) == 'true') {
          localStorage.removeItem('accordion-' + key);
        } else {
          localStorage.setItem('accordion-' + key, true);
        }
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Prepare the item object.
    const itemData = {
      name: `Nova ${type.capitalize()}`,
      type: type,
      data: foundry.utils.deepClone(header.dataset)
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];
    // Finally, create the item!
    return this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  /* -------------------------------------------- */
  //  
  _onToggleCarried(ev) {
    const li = $(ev.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    if (!item.system.equipada) {
      item.update({ "system.guardado": !item.system.guardado });
    }
  }

  /* -------------------------------------------- */
  //
  _onToggleEquipped(ev) {
    const li = $(ev.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    if (!item.system.guardado) {
      item.update({ "system.equipada": !item.system.equipada });
    }
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRoll(event, actor = null) {
    event.preventDefault();
    actor = !actor ? this.actor : actor;
    const a = event.currentTarget;
    const element = event.currentTarget;
    const dataset = element.dataset;
    const itemId = $(a).parents('.item').attr('data-item-id');
    let rollType = "outro";
    let item = {
      roll: dataset.roll,
      label: dataset.label,
    }

    if ($(a).hasClass('ataque-padrao-rollable')) {
      rollType = "padrao";
    } else if ($(a).hasClass('ataque-total-rollable')) {
      rollType = "total";
    } else if ($(a).hasClass('arma-multipla-rollable')) {
      rollType = "multiplo";
    } else if ($(a).hasClass('bloqueio-rollable')) {
      rollType = "bloqueio";
    } else if ($(a).hasClass('bloqueio-maior-rollable')) {
      rollType = "bloqueioMaior";
    } else if ($(a).hasClass('iniciativa-rollable')) {
      rollType = "iniciativa";
    }

    if (itemId && ($(a).hasClass('virtude-rollable') || $(a).hasClass('fraqueza-rollable') || $(a).hasClass('armadura-rollable') || $(a).hasClass('posse-rollable') || $(a).hasClass('acao-rollable'))) {
      item = actor.items.get(itemId);
      item.roll = dataset.roll;
      item.label = dataset.label;
    }

    if (itemId) {
      if (rollType == "multiplo") {
        let quantidade = item.roll.split('d')[0];
        quantidade -= 2;
        item.roll = quantidade + 'd6'
        item.label = game.i18n.localize("cronicasrpg.acao.primeiro") + ' ' + dataset.label;
        await prepRoll(event, item, actor, rollType);
        item.label = game.i18n.localize("cronicasrpg.acao.segundo") + ' ' + dataset.label;
      }
    }

    await prepRoll(event, item, actor, rollType);
  }
}
