
// NOTE (Garrett): Argument order matters! This is what will be used to generate the code for pois,behaviors
export function GetArguments(type)
{
	let args = [];
	switch (type)
	{
	case "Run Path":
	{
		args.push({type: "text", hint: "Path Location", required: true});
		args.push({type: "text", hint: "Doors: ex '85,86,32'", required: false});
		args.push({type: "checkbox", hint: "Finish Behavior", required: false});
		args.push({type: "select", title: "Mode", default: "linear", items: ["linear", "circular", "trigger", "reverse"], required: true});
		break;
	}
	case "TestBlock":
	{
		break;
	}
	default:
		console.error("Unknown Block Type: " + type);
		break;
	}

	return args;
}