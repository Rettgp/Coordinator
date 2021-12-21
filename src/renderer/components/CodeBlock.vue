<template>
<div v-draggable="item">
    Block
</div>
</template>

<script>
import { Draggable } from 'draggable-vue-directive'

export default
{
    name: "codeblock",
    props:
    {
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
		}
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
        };
    },
    created: function () {
	},
    mounted: function () 
	{
	},
    methods:
    {
		OnPositionChanged(position_diff, absolute_position, event)
		{
			this.$emit("position-changed", this, absolute_position);
		},
		OnDragEnd(position_diff, absolute_position, event)
		{
			this.$emit("drag-ended", this, absolute_position);

			console.log("Drag end");
			if (!this.assigned)
			{
				console.log("Reset");
				this.item.resetInitialPos = true;
				setTimeout(() => {
					this.item.resetInitialPos = false;
				}, 0);
			}
		}
    }
};
</script>

<style>
</style>
