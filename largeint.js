export default function LargeInt(number, decimalSeparator=getDecSep())
{
    if(typeof number === 'string')
    {
	var casted = Number(number);
	if(Number.isNaN(casted))
	{
	    throw "The value supplied as an integer is not a number. If you have included thousand separators (e.g. the commas in 1,000,000), remove them and try again.";
	}
	else
	{
	    number = number.trim();
	    //todo: currently specifying a different separator to the local one will throw an error,
	    //so this is a bit convoluted, but I intend to make the parameter actually useful.
	    this.number = number.split(decimalSeparator)[0];
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

    if(this.number[0] == '-')
    {
	this.sign = '-';
	this.number = this.number.substring(1, this.number.length);
    }
    else if(this.number[0] == '+')
    {
	this.sign = '+';
	this.number = this.number.substring(1, this.number.length);
    }
    else
    {
	this.sign = '+';
    }
}

LargeInt.prototype.toString = function()
{
    return this.sign + this.number;
};

LargeInt.prototype.add = function(largeRHS)
{
    if(largeRHS.sign != this.sign)
    {
	if(this.sign === '-')
	{
	    return largeRHS.subtract(new LargeInt(this.number));
	}
	else
	{
	    return this.subtract(new LargeInt(largeRHS.number));
	}
    }

    let result = '0';
    let lhs = this.number.split('');
    let rhs = largeRHS.number.split('');

    while(lhs.length > rhs.length)
    {
	rhs.unshift('0');
    }

    while(rhs.length > lhs.length)
    {
	lhs.unshift('0');
    }

    let resultArr = lhs.map((ldigit, index) =>
			    {
				let rdigit = rhs[index];
				let val = Number(ldigit) + Number(rdigit)
				let parts = [];
				if (val > 9)
				{
				    parts = [1, val % 10];
				}
				else
				{
				    parts = [0, val];
				}
				return parts;
			    }).reverse();

    result = resultArr.reduce((output, val, index) =>
			      {
				  let rem = 0;
				  if(index > 0)
				  {
				      rem = resultArr[index-1][0];
				  }
				  val[1] += rem;
				  if (val[1] > 9)
				  {
				      val[0]++
				      val[1] = val[1] % 10;
				  }
				  output.unshift(val[1]);
				  if(index === resultArr.length-1 && val[0] > 0)
				  {
				      output.unshift(val[0]);
				  }
				  return output;
			      }, []).join('');

    return new LargeInt(this.sign+result);
};

LargeInt.prototype.subtract = function(largeRHS)
{
    //todo: finish this
    return new LargeInt('0');
};

// credit to Chris Nielsen (https://stackoverflow.com/a/1308446/204723)
function getDecSep()
{
    var n = 1.1;
    return n.toLocaleString().substring(1, 2);
}
