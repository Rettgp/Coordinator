
function GetCodeBlock(type)
{
	switch (type)
	{
	case "TestBlock":
	{
		TestBlockCode();
		break;
	}
	default:
		console.error("Unknown Block Type: " + type);
		break;
	}
}

function TestBlockCode()
{
	return "local foo = 100";
}