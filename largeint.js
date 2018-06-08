export default function LargeInt(number)
{
    if(typeof number === 'string')
    {
	var casted = Number(number);
	if(Number.isNaN(caster))
	{
	    throw "The value in 'number' is not a number.";
	}
	else
	{
	    this.number = number;
	}
    }

    else if (typeof number === 'number')
    {
	this.number = Math.floor(number).toString();
    }

    else
    {
	throw "The type of the 'number' parameter must be 'string' or 'number'";
    }
}
