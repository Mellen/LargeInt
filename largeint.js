export default function LargeInt(number, decimalSeparator=getDecSep())
{
    if(typeof number === 'string')
    {
	var casted = Number(number);
	if(Number.isNaN(casted))
	{
	    throw "The value supplied as an integer ("+number+") is not a number. If you have included thousand separators (e.g. the commas in 1,000,000), remove them and try again.";
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

    while(this.number === '0' && this.number.length > 1)
    {
	this.number = this.number.slice(1);
    }
}

LargeInt.prototype.toString = function()
{
    return this.sign + this.number;
};

LargeInt.prototype.add = function(largeRHS)
{
    if(largeRHS.number === '0')
    {
	return new LargeInt(this.sign+this.number);
    }

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
    if(this.equals(largeRHS))
    {
	return new LargeInt('0');
    }

    if(largeRHS.number === '0')
    {
	return new LargeInt(this.sign+this.number);
    }

    if(this.number === '0' && largeRHS.sign === '+')
    {
	return new LargeInt('-'+largeRHS.number);
    }

    if(this.sign != largeRHS.sign)
    {
	let a = new LargeInt(this.number);
	let b = new LargeInt(largeRHS.number);
	let c = a.add(b);
	c.sign = this.sign;
	return c;
    }

    let swapped = false;

    if(this.lessThan(largeRHS))
    {
	var lhs = largeRHS.number.split('');
	var rhs = this.number.split('');
	swapped = true;
    }
    else
    {
	var lhs = this.number.split('');
	var rhs = largeRHS.number.split('');
    }

    while(lhs.length > rhs.length)
    {
	rhs.unshift('0');
    }

    while(rhs.length > lhs.length)
    {
	lhs.unshift('0');
    }

    var resultArr = lhs.map((ldigit, index) => ldigit - rhs[index]).reverse();

    var result = resultArr.reduce((output, val, index) =>
				  {
				      if(val < 0 && index < resultArr.length - 1)
				      {
					  resultArr[index+1]--;
					  val += 10;
				      }
				      output.unshift(val);
				      return output;
				  }, []).join('');

    while(result[0] === '0' && result.length > 1)
    {
	result = result.slice(1);
    }

    let newSign = swapped ? '-' : '+' ;

    return new LargeInt(newSign+result);
};

LargeInt.prototype.equals = function(largeRHS)
{
    return this.sign === largeRHS.sign && this.number === largeRHS.number;
};

LargeInt.prototype.greaterThan = function(largeRHS)
{
    if(this.equals(largeRHS))
    {
	return false;
    }

    if(this.sign === '+' && largeRHS.sign === '-')
    {
	return true;
    }

    if(this.sign === '-' && largeRHS.sign === '+')
    {
	return false;
    }

    if(this.sign === '-')
    {
	return this.number < largeRHS.number;
    }

    return this.number > largeRHS.number;
};

LargeInt.prototype.lessThan = function(largeRHS)
{
    if(this.equals(largeRHS))
    {
	return false;
    }
    return !this.greaterThan(largeRHS);
};

// credit to Chris Nielsen (https://stackoverflow.com/a/1308446/204723)
function getDecSep()
{
    var n = 1.1;
    return n.toLocaleString().substring(1, 2);
}
