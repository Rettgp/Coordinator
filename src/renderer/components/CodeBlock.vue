<template>
<v-card elevation="10" outlined class="theme--dark" v-draggable="item">
	<v-expand-transition>
		<div>
			<div v-show="top_link !== undefined">
				<font-awesome-icon icon="link" />
			</div>
			<div v-show="hover_top_link === true">
				<font-awesome-icon icon="arrow-up" />
			</div>
		</div>
    </v-expand-transition>
	<div class="card-content">
		{{type}} {{name}}
		<CodeBlockArguments ref="CodeBlockArguments" :args="args"/>
	</div>
	<v-expand-transition>
		<div>
			<div v-show="bottom_link !== undefined">
				<font-awesome-icon icon="link" />
			</div>
			<div v-show="hover_bottom_link === true">
				<font-awesome-icon icon="arrow-down" />
			</div>
		</div>
    </v-expand-transition>
</v-card>
</template>

<script>
import { Draggable } from 'draggable-vue-directive'
import CodeBlockArguments from './CodeBlockArguments';

export default
{
    name: "codeblock",
    components:
    {
		CodeBlockArguments
    },
    props:
    {
        name: String,
        type: String,
		assigned: {
			type: Boolean,
			required: false,
			default: false
		},
		boundingRect: {
			type: Object,
			required: false,
			default: undefined
		},
		args: {
			type: Array,
			required: false,
			default() {
				return [];
			}
		},
    },
	directives: {
		Draggable,
	},

    data: function ()
    {
        return {
			item: {
				onPositionChange: this.OnPositionChanged,
				onDragEnd: this.OnDragEnd,
				resetInitialPos: false,
				boundingRect: this.boundingRect
			},
			bottom_link: undefined,
			top_link: undefined,
			hover_bottom_link: false,
			hover_top_link: false
        };
    },
    created: function () {
	},
    mounted: function () 
	{
	},
    methods:
    {
		Valid()
		{
			this.$refs.CodeBlockArguments.Validate();
			return this.$refs.CodeBlockArguments.valid;
		},
		GetArguments()
		{
			console.log(this.$refs.CodeBlockArguments.GetArguments());
			return this.$refs.CodeBlockArguments.GetArguments();
		},
		OnPositionChanged(position_diff, absolute_position, event)
		{
			if (this.bottom_link)
			{
				let rect = this.$el.getBoundingClientRect();
				let bottom_rect = this.bottom_link.$el.getBoundingClientRect();
				this.bottom_link.item.initialPosition = {left: 0, top: 0};
				this.bottom_link.item.initialPosition.left = rect.x;
				this.bottom_link.item.initialPosition.top = rect.y + bottom_rect.height;
				this.bottom_link.OnPositionChanged(position_diff, absolute_position, undefined)
			}

			this.$emit("position-changed", this, absolute_position, position_diff, event);
		},
		OnDragEnd(position_diff, absolute_position, event)
		{
			this.$emit("drag-ended", this, absolute_position);

			if (this.bottom_link)
			{
				this.bottom_link.item.resetInitialPos = true;
				setTimeout(() => {
					this.bottom_link.item.resetInitialPos = false;
				}, 0);
				this.bottom_link.OnDragEnd(position_diff, absolute_position, event);
			}

			if (!this.assigned)
			{
				this.item.resetInitialPos = true;
				setTimeout(() => {
					this.item.resetInitialPos = false;
					this.$el.style.position = "revert";
				}, 0);
			}
		},

		HoverLinkTop(link)
		{
			this.hover_top_link = !this.top_link && link;
		},
		HoverLinkBottom(link)
		{
			this.hover_bottom_link = !this.bottom_link && link;
		},

		LinkTop(block)
		{
			this.top_link = block;
		},
		LinkBottom(block)
		{
			this.bottom_link = block;

			if (this.bottom_link)
			{
				let rect = this.$el.getBoundingClientRect();
				let bottom_rect = this.bottom_link.$el.getBoundingClientRect();
				this.bottom_link.item.initialPosition = {left: 0, top: 0};
				this.bottom_link.item.initialPosition.left = rect.x;
				this.bottom_link.item.initialPosition.top = rect.y + bottom_rect.height;
			}
		},
    }
};
</script>

<style scoped>
.v-card {
	position: "revert";
	display: flex;
	flex-direction: column;
	align-items: center;
}

.card-content {
	padding: 1em;
}

.theme--dark.v-card {
	background-color: darksalmon;
}

</style>
