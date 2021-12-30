<template>
	<v-form ref="form" v-model="valid">
		<div class="arg" v-for="(arg, i) in args" :key="i">
			<v-text-field
				v-if="arg.type === 'text' && !IsHidden(arg.hiddenGroup)"
				v-model="text_fields[i]"
				:label="arg.hint"
				:rules="arg.required ? text_rules : undefined"
				hide-details="auto"
				:required="arg.required"
			></v-text-field>
			<v-select 
				v-if="arg.type === 'select' && !IsHidden(arg.hiddenGroup)"
				v-model="selects[i]"
				:rules="arg.required ? select_rules : undefined"
				:items="arg.items" 
				:label="arg.title"
				hide-details="auto"
				:required="arg.required"
			></v-select>
			<v-checkbox 
				v-if="arg.type === 'checkbox' && !IsHidden(arg.hiddenGroup)"
				v-model="checks[i]"
				:label="arg.hint"
				hide-details="auto"
			></v-checkbox>
			<v-btn 
				v-if="arg.type === 'button' && !IsHidden(arg.hiddenGroup)"
				@click="ShowHiddenGroup(arg.onclick)"
				elevation="2"
			>
				{{arg.text}}
			</v-btn>
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
			hidden_groups: [
				true, true, true
			],
			valid: false
        };
    },
	computed: {
	},
    created: function () {
	},
    mounted: function () 
	{
	},
    methods:
    {
		IsHidden(group)
		{
			return group !== undefined && this.hidden_groups[group];
		},
		Validate()
		{
			this.$refs.form.validate();
		},
		GetArguments()
		{
			let computed_args = []
			let key_values = false;
			for (let i = 0; i < this.args.length; ++i)
			{
				let arg = this.args[i];
				switch (arg.type)
				{
				case "button":
				{
					computed_args.push("KEYVALUES");
					key_values = true;
					break;
				}
				case "select":
				{
					computed_args.push(this.selects[i] !== "" ? this.selects[i] : false);
					break;
				}
				case "text":
				{
					if (key_values)
					{
						computed_args.push(arg.hint);
					}
					computed_args.push(this.text_fields[i] !== "" ? this.text_fields[i] : false);
					break;
				}
				case "checkbox":
				{
					computed_args.push(this.checks[i] !== "" ? this.checks[i] : false);
					break;
				}
				}
			}
			return computed_args;
		},
		InnerBlocks()
		{
			return this.inner_blocks
		},
		ShowHiddenGroup(group)
		{
			this.hidden_groups[group] = false;
			this.$forceUpdate();
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
.keyValue {
	display: flex;
	flex-direction: row;
	align-items: center;
}
</style>
