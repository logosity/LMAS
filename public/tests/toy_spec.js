describe('TOY machine', function() {
  it('can load a program into memory at default location', function() {
    var program = ['1234','4567','89AB'];
    var memmap = $('<div>');

    memmap.append($('<div>').attr('id','M10'));
    memmap.append($('<div>').attr('id','M11'));
    memmap.append($('<div>').attr('id','M12'));
    memmap.append($('<div>').attr('id','M13').text("0000"));

    var toy = new Toy();
    var result = toy.load(memmap,program.join('\n') + '\n');
    expect($(result).find("#M10").text()).toEqual(program[0]);
    expect($(result).find("#M11").text()).toEqual(program[1]);
    expect($(result).find("#M12").text()).toEqual(program[2]);
    expect($(result).find("#M13").text()).toEqual('0000');
  });
});
