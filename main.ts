/* eslint-disable no-mixed-spaces-and-tabs */
import { MarkdownView, Plugin, WorkspaceLeaf } from "obsidian";

export default class CycleThroughPanes extends Plugin {

  onload() {
    console.log('loading plugin: Cycle through panes');

	this.addCommand({
		id: 'cycle-through-panes',
		name: 'Cycle through Panes'
		checkCallback: (checking: boolean) => {
			const active = this.app.workspace.activeLeaf;
			if (active) {
				if (!checking) {
					const leafs = this.app.workspace.getLeavesOfType("markdown");
					const index = leafs.indexOf(active);
					if (index === leafs.length - 1) {
						this.app.workspace.setActiveLeaf(leafs[0], true, true);
					} else {
						this.app.workspace.setActiveLeaf(leafs[index + 1], true, true);
					}
				}
				return true;
			}
			return false;
		}
	});

	this.addCommand({
		id: 'cycle-through-panes-back',
		name: 'Cycle through Panes Back',
		checkCallback: (checking: boolean) => {
			const active = this.app.workspace.activeLeaf;
			if (active) {
				if (!checking) {
					const leafs = this.app.workspace.getLeavesOfType("markdown");
					const index = leafs.indexOf(active);
					if (index === 0) {
						this.app.workspace.setActiveLeaf(leafs[leafs.length - 1], true, true);
					} else {
						this.app.workspace.setActiveLeaf(leafs[index - 1], true, true);
					}
				}
				return true;
			}
			return false;
		}
	});
  }

  onunload() {
    console.log('unloading plugin: Cycle through panes');
  }
}