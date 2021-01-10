/* Standardized Roll Script */
export async function prepRoll(event, item, actor = null, extra = {}) {
    actor = !actor ? this.actor : actor;
    // Initialize variables.
    event.preventDefault();

    let formula = item.roll;
    let flavorText = item.label;
    let rollMode = game.settings.get("core", "rollMode");

    let templateData = {
        title: flavorText,
        rollMode: rollMode,
        rollModes: CONFIG.Dice.rollModes,
    };
    formula = formula
        .replace(/ /g, "")
        .replace(/\+0/g, "")
        .replace(/\-0/g, "")
        .replace(/\++/g, "+");
    if (!event.shiftKey) {
        rollCronicas(formula, actor, templateData);
    } else {
        templateData.formula = formula;
        templateData.rollMode = rollMode;
        let dialogCallback = (html) => {
            rollMode = html.find('[name="rollMode"]').val();
            let rollMod = html.find('[name="mod"]').val();
            if (
                rollMod.length > 0 &&
                rollMod.trim().charAt(0) != "+" &&
                rollMod.trim().charAt(0) != "-"
            )
                rollMod = "+" + rollMod;
            formula = formula + rollMod;
            rollCronicas(formula, actor, templateData);
        };
        return new Promise((resolve) => {
            renderTemplate("systems/cronicasrpg/templates/chat/roll-dialog.html", templateData).then((dlg) => {
                new Dialog({
                    title: "Rolagem de " + flavorText,
                    content: dlg,
                    buttons: {
                        normal: {
                            label: "Rolar",
                            callback: (html) => {
                                resolve(dialogCallback(html));
                            },
                        },
                    },
                    default: "normal",
                    close: () => {
                        // noop
                    },
                }).render(true);
            });
        });
    }
}


function rollCronicas(roll, actor, templateData, criticoM = null) {
    // Render the roll
    let template = "systems/cronicasrpg/templates/chat/chat-card.html";
    let dmgroll = null;
    // GM rolls.
    let combate = game.combats.active;

    let chatData = {
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({
            actor: actor,
        }),
        flags: { "core.canPopout": true },
    };

    let rollMode = game.settings.get("core", "rollMode");
    if (templateData.rollMode) {
        rollMode = templateData.rollMode;
    }

    if (["gmroll", "blindroll"].includes(rollMode))
        chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData["whisper"] = [game.user._id];
    if (rollMode === "blindroll") chatData["blind"] = true;

    // Handle dice rolls.
    let formula = "";
    let result;
    let danoFormula = false;
    let critFormula = false;
    let tipo = "";
    let sucessos = 0;

    //Changing all empty dices to d6
    roll = roll.replace(/[Dd][\+]/g, "d6+").replace(/[Dd][\-]/g, "d6-").replace(/[Dd]$/g, "d6");
    //counting success
    roll = roll.trim().replace(/([\+])/g, " +").replace(/([\-])/g, " -");
    const dados = roll.split(" ");
    roll = "";
    dados.forEach(function (dado) {
        if (dado.match(/.*[sS].*/g)) {
            dado = dado.replace(/([sS])/g, "");
            sucessos += Number(dado);
        }
        else {
            let quantidade = dado.split("d")[0];
            for (let i = 0; i < quantidade; i++) {
                roll += "+1d6";
            }
        }
    })

    if (roll.match(/(\d*)d\d+/g)) {
        formula = roll;
    } else if (Number(roll) !== NaN) {
        formula = null;
        result = new Roll(roll).roll();
    }
    if (formula != null) {
        let roll = new Roll(`${formula}`);
        roll.roll();
        result = roll.results[0];

        if (result == 6) {
            tipo = "critico";
        } else if (result == 5 || result == 4) {
            tipo = "sucesso";
        } else if (result == 3 || result == 2) {
            tipo = "falha";
        } else if (result == 1) {
            tipo = "falha";
        }
        if (templateData.title == "Iniciativa" && combate) {
            let combatente = combate.combatants.find(
                (combatant) => combatant.actor.id === actor.id
            );
            if (combatente && combatente.iniciative == null) {
                combate.setInitiative(combatente._id, result);
                console.log(
                    "Foundry VTT | Iniciativa Atualizada para " +
                    combatente._id +
                    " (" +
                    combatente.actor.name +
                    ")"
                );
            }
        }
        let rollTemplate = {
            template: "systems/cronicasrpg/templates/chat/cronicaroll.html",
        };

        chatData.roll = roll;

        // Render it.
        roll.render(rollTemplate).then((r) => {
            templateData.roll = r;
            renderTemplate(template, templateData).then((content) => {
                chatData.content = content;
                if (game.dice3d) {
                    game.dice3d
                        .showForRoll(
                            roll,
                            game.user,
                            true,
                            chatData.whisper,
                            chatData.blind
                        )
                        .then((displayed) => ChatMessage.create(chatData));
                    if (dmgroll) {
                        game.dice3d.showForRoll(
                            dmgroll,
                            game.user,
                            true,
                            chatData.whisper,
                            chatData.blind
                        );
                    }
                } else {
                    chatData.sound = CONFIG.sounds.dice;
                    ChatMessage.create(chatData);
                }
            });
        });
    } else {
        result.render(rollTemplate).then((r) => {
            templateData.roll = r;
            renderTemplate(template, templateData).then((content) => {
                chatData.content = content;
                ChatMessage.create(chatData);
            });
        });
    }
}
