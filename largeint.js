export default function LargeInt(number, decimalSeparator=getDecSep())
{
    var tempNumber;
    var sign;
    if(typeof number === 'string')
    {
	number = number.trim();
	var casted = Number(number);
	if(Number.isNaN(casted))
	{
	    throw Error('The value supplied as an integer ('+number+') is not a number. If you have included thousand separators (e.g. the commas in 1,000,000), remove them and try again.');
	}
	else if(number.indexOf('e') > -1)
	{
	    tempNumber = number;
	}
	else
	{
	    //todo: currently specifying a different separator to the local one will throw an error,
	    //so this is a bit convoluted, but I intend to make the parameter actually useful.
	    tempNumber = number.split(decimalSeparator)[0];
	}
    }
    else if(typeof number === 'number')
    {
	tempNumber = Math.floor(number).toString();
    }
    else
    {
	throw Error('The type of the "number" parameter must be "string" or "number"');
    }

    if(tempNumber[0] == '-')
    {
	sign = '-';
	tempNumber = tempNumber.slice(1);
    }
    else if(tempNumber[0] == '+')
    {
	sign = '+';
	tempNumber = tempNumber.slice(1);
    }
    else
    {
	sign = '+';
    }

    if(tempNumber.indexOf('e') > -1)
    {
	let expSep = 'e';
	if(tempNumber.indexOf('e+') > -1)
	{
	    expSep = 'e+';
	}
	let numberPart = tempNumber.split(expSep)[0];
	let powerPart = Number(tempNumber.split(expSep)[1]);

	let numberMain = numberPart;
	let numberSmall = '';

	if(numberPart.indexOf(decimalSeparator) > -1)
	{
	    numberMain = numberPart.split(decimalSeparator)[0];
	    numberSmall = numberPart.split(decimalSeparator)[1];
	}

	powerPart -= numberSmall.length;

	if(powerPart < 0)
	{
	    tempNumber = numberMain + numberSmall;
	    tempNumber = tempNumber.slice(0, tempNumber.length+powerPart);
	    if(tempNumber === '')
	    {
		tempNumber = '0';
	    }
	}
	else
	{
	    tempNumber = numberMain+numberSmall+'0'.repeat(powerPart);
	}
    }

    while(tempNumber[0] === '0' && tempNumber.length > 1)
    {
	tempNumber = tempNumber.slice(1);
    }

    //this makes the important information immutable
    Object.defineProperty(this, 'sign', {'value': sign});
    Object.defineProperty(this, 'number', {'value': tempNumber});
}

const safeLargeInt = new LargeInt(Number.MAX_SAFE_INTEGER);
const zero = new LargeInt(0);

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
	return new LargeInt(this.sign+c.number);
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

LargeInt.prototype.times = function(largeRHS)
{
    if(this.number === '0' || largeRHS.number === '0')
    {
	return new LargeInt('0');
    }

    if(this.equals(new LargeInt('1')))
    {
	return new LargeInt(largeRHS.sign+largeRHS.number);
    }

    if(largeRHS.equals(new LargeInt('1')))
    {
	return new LargeInt(this.sign+this.number);
    }

    let newsign = this.sign === largeRHS.sign ? '+' : '-';

    let lhs = this.number.split('').map(ldigit => Number(ldigit)).reverse();
    let rhs = largeRHS.number.split('').map(rdigit => Number(rdigit)).reverse();

    let parts = lhs.map((ldigit, index) =>
			{
			    let ps = rhs.map(rdigit =>
					     {
						 let result = ldigit * rdigit;
						 return [Math.floor(result/10), result%10];
					     });
			    let part = ps.reduce((output, p, index) =>
					      {
						  if(index === 0)
						  {
						      if(index === ps.length-1)
						      {
							  return p;
						      }
						      else
						      {
							  return [p[1]];
						      }
						  }

						  let val = p[1] + ps[index-1][0];

						  if(val > 9)
						  {
						      p[0]++;
						      val -= 10;
						  }

						  output.unshift(val);

						  if(index === ps.length-1)
						  {
						      let lastval = p[0];
						      if(lastval > 9)
						      {
							  lastval -= 10;
							  output.unshift(lastval);
							  output.unshift(1);
						      }
						      else
						      {
							  output.unshift(lastval);
						      }
						  }
						  return output;
					      }, []).join('');
			    return new LargeInt(part + '0'.repeat(index));
			});

    let result = parts.reduce((current, part) => current.add(part), new LargeInt('0'));

    return new LargeInt(newsign+result.number);
};

LargeInt.prototype.over = function(largeRHS)
{
    if(largeRHS.number === '0')
    {
	throw Error('Dividing by zero is not allowed.');
    }

    if(this.number === '0' || this.abs().lessThan(largeRHS.abs()))
    {
	return new LargeInt(0);
    }

    let newsign = largeRHS.sign === this.sign ? '+' : '-';

    if(largeRHS.number === '1')
    {
	return new LargeInt(newsign+this.number);
    }

    if(this.abs().lessThan(safeLargeInt)) //if it's small enough, just do a regular division!
    {
	let lhs = Number(this.number);
	let rhs = Number(largeRHS.number);
	let val = Math.floor(lhs/rhs);
	return new LargeInt(newsign + val)
    }

    let lhs = this.number.split('').map(ldigit => Number(ldigit));
    let rhs = largeRHS.number.split('').map(rdigit => Number(rdigit));

    let maxResultLength = (lhs.length - rhs.length)+1;

    let guess = new LargeInt('9'.repeat(maxResultLength));

    let absRHS = largeRHS.abs();
    let absLHS = this.abs();

    let guess_result = guess.times(absRHS);

    let diff = guess_result.subtract(absLHS);

    let curpos = 0;

    let goingup = diff < zero

    while(diff.abs().greaterThan(absRHS) && curpos < guess.number.length)
    {
	let digit = Number(guess.number[curpos])
	let crement = Math.floor(digit/2);
	let next_digit = digit-crement;
	if(goingup)
	{
	   next_digit = digit+crement;
	}

	let new_number = guess.number.substring(0, curpos) + next_digit.toString() + guess.number.substring(curpos+1);

	console.log(new_number);
	
	guess = new LargeInt(new_number);

	guess_result = guess.times(absRHS);

	diff = guess_result.subtract(absLHS);

	if(diff.lessThan(zero) && !goingup)
	{
	    goingup = true;
	    curpos++;
	}
	else if(!diff.lessThan(zero) && goingup)
	{
	    goingup = false;
	    curpos++;
	}
    }

    if (diff.abs().equals(absRHS))
    {
	if(diff.greaterThan(zero))
	{
	    guess = guess.subtract(new LargeInt(1));
	}
	else
	{
	    guess = guess.add(new LargeInt(1));
	}
    }

    return guess;
};

LargeInt.prototype.abs = function()
{
    return new LargeInt(this.number);
}

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
	if(this.number.length > largeRHS.number.length)
	{
	    return false;
	}
	else if(this.number.length < largeRHS.number.length)
	{
	    return true;
	}
	else
	{
	    return this.number < largeRHS.number;
	}
    }

    if(this.number.length > largeRHS.number.length)
    {
	return true;
    }
    else if(this.number.length < largeRHS.number.length)
    {
	return false;
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
