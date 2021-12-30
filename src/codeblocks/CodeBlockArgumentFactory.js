
// NOTE (Garrett): Argument order matters! This is what will be used to generate the code for pois,behaviors
export function GetArguments(type)
{
	let args = [];
	switch (type)
	{
	case "Run Path":
	{
		args.push({type: "text", id: "arg1", hint: "Path Location", required: true});
		args.push({type: "text", id: "arg2", hint: "Doors: ex '85,86,31'", required: false});
		args.push({type: "checkbox", id: "arg3", hint: "Finish Behavior", expect: "behavior", required: false});
		args.push({type: "select", id: "arg4", title: "Mode", default: "linear", items: ["linear", "circular", "trigger", "reverse"], required: true});
		break;
	}
	case "Interact":
	{
		args.push({type: "text", id: "arg1", hint: "NPC Name/Index", required: true});
		args.push({type: "text", id: "arg2", hint: "Menu ID", required: false});
		args.push({type: "checkbox", id: "arg3", hint: "Handler Function", expect: "function", required: false});
		args.push({type: "button", id: "arg4", text: "Add Response", onclick: 0, required: false});
		args.push({type: "text", id: "arg5", hint: "Option Index", hiddenGroup: 0, required: false});
		args.push({type: "text", id: "arg6", hint: "Automated Message", hiddenGroup: 0, required: false});
		args.push({type: "text", id: "arg7", hint: "_unknown1", hiddenGroup: 0, required: false});
		args.push({type: "text", id: "arg8", hint: "X", hiddenGroup: 0, required: false});
		args.push({type: "text", id: "arg9", hint: "Y", hiddenGroup: 0, required: false});
		args.push({type: "text", id: "arg10", hint: "Z", hiddenGroup: 0, required: false});
		args.push({type: "text", id: "arg11", hint: "_unknown2", hiddenGroup: 0, required: false});
		args.push({type: "button", text: "Add Response", hiddenGroup: 0, onclick: 1, required: false});
		args.push({type: "text", id: "arg12", hint: "Option Index", hiddenGroup: 1, required: false});
		args.push({type: "text", id: "arg13", hint: "Automated Message", hiddenGroup: 1, required: false});
		args.push({type: "text", id: "arg14", hint: "_unknown1", hiddenGroup: 1, required: false});
		args.push({type: "text", id: "arg15", hint: "X", hiddenGroup: 1, required: false});
		args.push({type: "text", id: "arg16", hint: "Y", hiddenGroup: 1, required: false});
		args.push({type: "text", id: "arg17", hint: "Z", hiddenGroup: 1, required: false});
		args.push({type: "text", id: "arg18", hint: "_unknown2", hiddenGroup: 1, required: false});
		break;
	}
	default:
		console.error("Unknown Block Type: " + type);
		break;
	}

	return args;
}