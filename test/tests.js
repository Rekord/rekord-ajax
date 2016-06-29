
module('Ajax');

test( 'all', function(assert)
{
  var done = assert.async();
  var prefix = 'all_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['completed', 'title', 'userId'],
    api: 'http://jsonplaceholder.typicode.com/todos/',
    load: Rekord.Load.All,
    cache: Rekord.Cache.None
  });

  expect(1);

  Task.ready(function()
  {
    strictEqual( Task.all().length, 200 );
    done();
  });
});

test( 'get', function(assert)
{
  var done = assert.async();
  var prefix = 'get_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['completed', 'title', 'userId'],
    api: 'http://jsonplaceholder.typicode.com/todos/'
  });

  expect(2);

  Task.fetch( 2, function(t2)
  {
    strictEqual( t2.title, 'quis ut nam facilis et officia qui' );
    strictEqual( t2.completed, false );
    done();
  });
});

test( 'create', function(assert)
{
  var done = assert.async();
  var prefix = 'create_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['completed', 'title', 'userId'],
    api: 'http://jsonplaceholder.typicode.com/todos/'
  });

  var t0 = Task.create({id: 201, title: 't0', completed: false});

  expect(1);

  t0.$once( Rekord.Model.Events.RemoteSaves, function()
  {
    strictEqual( t0.title, 't0' );
    done();
  });
});


test( 'update', function(assert)
{
  var done = assert.async();
  var prefix = 'update_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['completed', 'title', 'userId'],
    api: 'http://jsonplaceholder.typicode.com/todos/'
  });

  var t0 = Task.create({id: 2, title: 't0', completed: false});

  expect(2);

  t0.$once( Rekord.Model.Events.RemoteSaves, function()
  {
    strictEqual( t0.title, 't0' );

    t0.title = 't0a';
    t0.$save().then(function()
    {
      strictEqual( t0.title, 't0a' );
      done();
    });
  });
});

test( 'delete', function(assert)
{
  var done = assert.async();
  var prefix = 'delete_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['completed', 'title', 'userId'],
    api: 'http://jsonplaceholder.typicode.com/todos/'
  });

  expect(4);

  Task.fetch( 2, function(t2)
  {
    strictEqual( t2.title, 'quis ut nam facilis et officia qui' );
    strictEqual( t2.completed, false );
    ok( t2.$isSaved() );

    t2.$remove().then(function()
    {
      ok( t2.$isDeleted() );
      done();
    });
  });
});
