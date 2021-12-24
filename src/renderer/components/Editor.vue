<template>
<v-container fluid grid-list-md fill-height>
    <v-layout row wrap v-resize="OnResize">
        <v-flex d-flex xs3 sm3 md2 lg2 fill-height>
            <v-list style="z-index: 1" flat :height="windowSize.y - 150">
                <v-subheader>Blocks</v-subheader>
                <v-list-item-group>
					<v-list-item v-for="(item, i) in blocks" :key="i">
						<v-list-item-content>
							<CodeBlock :name="String(i)" :type="item" @drag-ended="OnCodeBlockMoved" @position-changed="OnBlockMoving"/>
						</v-list-item-content>
					</v-list-item>
                </v-list-item-group>
            </v-list>
        </v-flex>
        <v-flex d-flex xs9 sm9 md10 lg10 fill-height fill-width>
            <v-sheet id="codeArea" flat :height="windowSize.y - 150" :width="windowSize.x - 150">
			</v-sheet>
        </v-flex>
    </v-layout>
</v-container>
</template>

<script>
const Fs = require("fs");
const Path = require("path");
import EventBus from 'EventBus';
import DataStore from "DataStore";
import draggable from 'vuedraggable'
import CodeBlock from './CodeBlock';
import Vue from 'vue'
var CodeBlockClass = Vue.extend(CodeBlock)

const data_store = new DataStore(
{
    configName: 'user-preferences',
    defaults: null
});

export default
{
    name: "editor",
    components:
    {
        draggable,
		CodeBlock
    },
    data: function ()
    {
        return {
            windowSize:
            {
                x: 0,
                y: 0,
            },
            blocks: ["TestBlock", "TestBlock", "TestBlock"],
            assigned_blocks: [],
			code_block_path: [],
			render_timer: undefined
        };
    },

    mounted()
    {
		this.render_timer = setInterval(() => this.OnRenderTimeout(), 10);
    },
    created: function ()
    {
    },
    methods:
    {
		GetBlockLinks(check_block)
		{
			let links = {top: undefined, bottom: undefined};
			for (let assigned_block of this.assigned_blocks)
			{
				if (check_block === assigned_block)
				{
					continue;
				}

				let boundary_threshold = 5;

				let other_rect = assigned_block.$el.getBoundingClientRect();
				let current_rect = check_block.$el.getBoundingClientRect();
				let intersected_height = (current_rect.top - boundary_threshold <= other_rect.bottom && current_rect.top + boundary_threshold >= other_rect.top) ||
					(current_rect.bottom - boundary_threshold <= other_rect.bottom && current_rect.bottom + boundary_threshold >= other_rect.top);
				let intersected_width = (current_rect.left >= other_rect.left && current_rect.left <= other_rect.right) ||
					(current_rect.right >= other_rect.left && current_rect.right <= other_rect.right)

				if (intersected_height && intersected_width)
				{
					boundary_threshold = 10;
					let top_link = (current_rect.top - boundary_threshold <= other_rect.bottom && 
						current_rect.top + boundary_threshold >= (other_rect.top - other_rect.height/2));
					let bottom_link = (current_rect.bottom + boundary_threshold >= other_rect.top && 
						current_rect.bottom - boundary_threshold <= (other_rect.bottom - other_rect.height/2));
					if (!links.bottom)
					{
						links.bottom = bottom_link ? assigned_block : undefined;
					}
					if (!links.top)
					{
						links.top = top_link ? assigned_block : undefined;
					}
				}
			}

			return links;
		},

		CheckBlockLinks()
		{
			// Find and make links
			for (let check_block of this.assigned_blocks)
			{
				check_block.HoverLinkBottom(false);
				check_block.HoverLinkTop(false);

				let links = this.GetBlockLinks(check_block);
				check_block.LinkTop(links.top);
				check_block.LinkBottom(links.bottom);

			}

			// Find the start of the link
			let start_block = undefined;
			for (let check_block of this.assigned_blocks)
			{
				if (!check_block.top_link && check_block.bottom_link)
				{
					start_block = check_block;
					break;
				}
			}

			this.code_block_path = [];
			let sort_block = start_block;
			let sort_index = this.assigned_blocks.length;
			while (sort_block)
			{
				if (sort_block.top_link)
				{
					let other_rect = sort_block.top_link.$el.getBoundingClientRect();
					sort_block.$el.style.top = other_rect.bottom - 5 + "px";
					sort_block.$el.style.left = other_rect.left + "px";
				}

				sort_block.$el.style.zIndex = sort_index
				this.code_block_path.push(sort_block);
				sort_block = sort_block.bottom_link;
				sort_index--;
			}
		},

		OnRenderTimeout()
		{
			if (this.$el.offsetParent)
			{
			}
		},

        OnResize()
        {
			// TODO (Garrett): need to resize assigned blocks bounding rect
            this.windowSize = {
                x: window.innerWidth,
                y: window.innerHeight
            };
        },

		OnBlockMoving(block, pos, diff, event)
		{
			if (event && event.ctrlKey)
			{
				block.bottom_link = undefined;
				block.top_link = undefined;
			}

			for (let check_block of this.assigned_blocks)
			{
				check_block.HoverLinkBottom(false);
				check_block.HoverLinkTop(false);

				let links = this.GetBlockLinks(check_block);
				check_block.HoverLinkTop(links.top !== undefined);
				check_block.HoverLinkBottom(links.bottom !== undefined);

				if (check_block.top_link)
				{
					let other_rect = check_block.top_link.$el.getBoundingClientRect();
					check_block.$el.style.top = other_rect.bottom - 5 + "px";
					check_block.$el.style.left = other_rect.left + "px";
				}
			}
		},

		OnCodeBlockMoved(block, absolute_position)
		{
			let parent_el = document.getElementById("codeArea");
			let parent_rect = document.getElementById("codeArea").getBoundingClientRect();

			if ((absolute_position.top < parent_rect.top || absolute_position.top > parent_rect.bottom) ||
				(absolute_position.left < parent_rect.left || absolute_position.left > parent_rect.right))
			{
				return;
			}

			let new_block = new CodeBlockClass(
				{
					propsData: { 
						name: block.name,
						type: "TestBlock",
						assigned: true,
						boundingRect: {
							top: parent_rect.top, 
							left: parent_rect.left, 
							right: parent_rect.right, 
							bottom: parent_rect.bottom,
						}
					}
				}
			)
			new_block.$on("position-changed", this.OnBlockMoving);
			new_block.$on("drag-ended", this.CheckBlockLinks);
			new_block.$mount();
			new_block.$el.className += " assigned-block";
			new_block.$el.style.top = absolute_position.top + "px";
			new_block.$el.style.left = absolute_position.left + "px";
			parent_el.appendChild(new_block.$el);
			this.assigned_blocks.push(new_block);
		},
    }
};
</script>

<style>
.v-list {
    min-width: 100px;
    width: 100%;
    overflow-y: auto;
}

.v-list-item {
	padding-bottom: 16px;
}

.v-sheet {
	position: relative;
}

.assigned-block {
	position: fixed;
	top: 0;
	left: 0;
}

draggable {
	height: 100%
}
</style>
