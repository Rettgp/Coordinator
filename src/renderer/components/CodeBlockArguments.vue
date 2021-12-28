<template>
	<v-form ref="form" v-model="valid">
		<div class="arg" v-for="(arg, i) in args" :key="i">
			<v-text-field
				v-if="arg.type === 'text'"
				v-model="text_fields[i]"
				:label="arg.hint"
				:rules="arg.required ? text_rules : undefined"
				hide-details="auto"
				:required="arg.required"
			></v-text-field>
			<v-select 
				v-if="arg.type === 'select'"
				v-model="selects[i]"
				:rules="arg.required ? select_rules : undefined"
				:items="arg.items" 
				:label="arg.title"
				hide-details="auto"
				:required="arg.required"
			></v-select>
			<v-checkbox 
				v-if="arg.type === 'checkbox'"
				v-model="checks[i]"
				:label="arg.hint"
				hide-details="auto"
			></v-checkbox>
		</div>
	</v-form>
</template>

<script>
import { Draggable } from 'draggable-vue-directive'

export default
{
    name: "codeblockarguments",
    props:
    {
		args: Array
    },
	directives: {
		Draggable,
	},
	computed: {
	},
    data: function ()
    {
        return {
			checks: new Array(this.args.length).fill(""),
			selects: new Array(this.args.length).fill(""),
			text_fields: new Array(this.args.length).fill(""),
			inner_blocks: [],
			text_rules: [
				value => !!value || 'Required.',
			],
			select_rules: [
				value => !!value || 'Required.',
			],
			valid: false
        };
    },
    created: function () {
	},
    mounted: function () 
	{
	},
    methods:
    {
		Validate()
		{
			this.$refs.form.validate();
		},
		GetArguments()
		{
			let computed_args = new Array(this.args.length).fill(false);
			for (let i = 0; i < this.args.length; ++i)
			{
				switch (this.args[i].type)
				{
				case "select":
				{
					computed_args[i] = this.selects[i] !== "" ? this.selects[i] : false;
					break;
				}
				case "text":
				{
					computed_args[i] = this.text_fields[i] !== "" ? this.text_fields[i] : false;
					break;
				}
				case "checkbox":
				{
					computed_args[i] = this.checks[i] !== "" ? this.checks[i] : false;
					break;
				}
				}
			}
			return computed_args;
		},
		InnerBlocks()
		{
			return this.inner_blocks
		}
    }
};
</script>

<style scoped>
.arg {
	display: flex;
	flex-direction: row;
	align-items: center;
}
</style>
