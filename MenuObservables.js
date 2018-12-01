var inquirer = require('inquirer');
var fs = require('fs');
var rxjs = require('rxjs');
var map = require('rxjs/operators').map;
var mergeMap = require('rxjs/operators').mergeMap;
var queEs = {
    name: 'queEsUsted',
    type: 'list',
    message: '¿Qué es usted?',
    choices: ['Comprador', 'Vendedor'],
    default: 1,
};
var menuVendedor = {
    name: 'menuVendedor',
    type: 'list',
    message: 'Escoja una opción:',
    choices: ['Ingresar más productos', 'Ingresar Usuarios'],
    default: 2,
};
var ingresarUser = [{
        name: 'nombre',
        type: 'input',
        message: 'Ingrese un usuario'
    }, {
        name: 'contraseña',
        type: 'password',
        message: 'Ingrese un contraseña',
        mask: '*'
    }];
var menuComprador = {
    name: 'menuComprador',
    type: 'list',
    message: 'Escoja una opción:',
    choices: ['Escojer producto a comprar', 'Productos a comprar'],
    default: 2,
};
var logi = [{
        name: 'user',
        type: 'input',
        message: 'Ingrese su usuario: '
    }, {
        name: 'pass',
        type: 'password',
        message: 'Ingrese su contraseña: ',
        mask: '*'
    }];
var confirmarMasProductos = {
    name: 'confirm',
    type: 'confirm',
    message: 'Desea comprar mas productos',
};
var ingresarProductos = [{
        name: 'nombre',
        type: 'input',
        message: 'Ingrese el nombre del producto: '
    }, {
        name: 'categoria',
        type: 'input',
        message: 'Ingrese la categoria del producto: '
    }, {
        name: 'precio',
        type: 'input',
        message: 'Ingrese el precio del producto: '
    }];
function main() {
    inicializarBase().pipe(mergeMap(function (respuestaBDD) {
        return preguntaQueEs().pipe(map(function (respuesta) {
            return {
                respuestaUsuario1: respuesta,
                respuestaBDD: respuestaBDD
            };
        }));
    }), mergeMap(function (respuestaUsuario) {
        switch (respuestaUsuario.respuestaUsuario1.queEsUsted) {
            case 'Comprador': {
                return preguntasComprador().pipe(map(function (respuestaMenuComprador) {
                    return {
                        respuestaUsuario1: respuestaUsuario.respuestaUsuario1,
                        respuestaCompra: respuestaMenuComprador,
                        respuestaBDD: respuestaUsuario.respuestaBDD
                    };
                }));
            }
            case 'Vendedor': {
                return preguntasVendedor().pipe(map(function (respuestaMenuVendedor) {
                    return {
                        respuestaUsuario1: respuestaUsuario.respuestaUsuario1,
                        respuestaVenta: respuestaMenuVendedor,
                        respuestaBDD: respuestaUsuario.respuestaBDD
                    };
                }));
            }
        }
    }), mergeMap(function (respuesta) {
        if (respuesta.respuestaUsuario1.queEsUsted === 'Vendedor') {
            switch (respuesta.respuestaVenta.menuVendedor) {
                case 'Ingresar Usuarios':
                    return rxjs.from(inquirer.prompt(ingresarUser)).pipe(map(function (usuario) {
                        respuesta.usuario = usuario;
                        return respuesta;
                    }));
                case 'Ingresar más productos':
                    return rxjs.from(inquirer.prompt(ingresarProductos)).pipe(map(function (productos) {
                        respuesta.producto = productos;
                        return respuesta;
                    }));
            }
        }
        else if (respuesta.respuestaUsuario1.queEsUsted === 'Comprador') {
            switch (respuesta.respuestaCompra.menuComprador) {
                case 'Escojer producto a comprar':
                    //leer base
                    var productos_1 = [];
                    respuesta.respuestaBDD.bdd.productos.forEach(function (elemento) {
                        productos_1.push(elemento.nombre);
                    });
                    var listaProductos = {
                        name: 'productos',
                        type: 'list',
                        message: 'Escoja una opción:\nProducto: ',
                        choices: productos_1,
                        default: 0,
                    };
                    return rxjs.from(inquirer.prompt(listaProductos)).pipe(map(function (respuestaProductos) {
                        return {
                            respuestaUsuario1: respuesta.respuestaUsuario1,
                            respuestaCompra: respuesta.respuestaCompra,
                            respuestaBDD: respuesta.respuestaBDD,
                            respuestaProducto: respuestaProductos
                        };
                    }));
                //enlistar los productos
                //escojemos la opcion
                case 'Productos a comprar':
            }
        }
    }), map(function (respuesta) {
        if (respuesta.respuestaUsuario1.queEsUsted === 'Vendedor') {
            switch (respuesta.respuestaVenta.menuVendedor) {
                case 'Ingresar Usuarios':
                    var usuario = respuesta.usuario;
                    respuesta.respuestaBDD.bdd.usuarios.push(usuario);
                    return respuesta;
                case 'Ingresar más productos':
                    var producto = respuesta.producto;
                    respuesta.respuestaBDD.bdd.productos.push(producto);
                    return respuesta;
            }
        }
        else if (respuesta.respuestaUsuario1.queEsUsted === 'Comprador') {
            switch (respuesta.respuestaCompra.menuComprador) {
                case 'Escojer producto a comprar':
                    //añadir a la compra
                    console.log(respuesta.respuestaProducto.productos);
                case 'Productos a comprar':
            }
        }
    })
    /*,mergeMap(
        (respuesta: RespuestaUsuario) => {
            return guardarBase(respuesta.respuestaBDD.bdd);
        }
    )*/
    ).subscribe(function (mensaje) {
        console.log(mensaje);
    }, function (error) {
        console.log(error);
    }, function () {
        console.log('Completado');
        main();
    });
}
function preguntaQueEs() {
    return rxjs.from(inquirer.prompt(queEs));
}
function preguntasComprador() {
    return rxjs.from(inquirer.prompt(menuComprador));
}
function preguntasVendedor() {
    return rxjs.from(inquirer.prompt(menuVendedor));
}
function inicializarBase() {
    var leerBDD$ = rxjs.from(leerBDD());
    return leerBDD$.pipe(mergeMap(function (respuestaLeerBDD) {
        if (respuestaLeerBDD.bdd) {
            // truty / {}
            return rxjs.of(respuestaLeerBDD);
        }
        else {
            // falsy / null
            return rxjs.from(crearBDD());
        }
    }));
}
function leerBDD() {
    return new Promise(function (resolve) {
        fs.readFile('bdd.json', 'utf-8', function (error, contenidoLeido) {
            if (error) {
                resolve({
                    mensaje: 'Base de datos vacia',
                    bdd: null
                });
            }
            else {
                resolve({
                    mensaje: 'Si existe la Base',
                    bdd: JSON.parse(contenidoLeido)
                });
            }
        });
    });
}
function crearBDD() {
    var contenidoInicialBDD = '{"usuarios":[],"productos":[]}';
    return new Promise(function (resolve, reject) {
        fs.writeFile('bdd.json', contenidoInicialBDD, function (err) {
            if (err) {
                reject({
                    mensaje: 'Error creando Base',
                    error: 500
                });
            }
            else {
                resolve({
                    mensaje: 'BDD creada',
                    bdd: JSON.parse('{"usuarios":[],"productos":[]}')
                });
            }
        });
    });
}
function guardarBase(bdd) {
    return new Promise(function (resolve, reject) {
        fs.writeFile('bdd.json', JSON.stringify(bdd), function (err) {
            if (err) {
                reject({
                    mensaje: 'Error guardando BDD',
                    error: 500
                });
            }
            else {
                resolve({
                    mensaje: 'BDD guardada'
                });
            }
        });
    });
}
function anadirUsuario(usuario) {
    return new Promise(function (resolve, reject) {
        fs.readFile('bdd.json', 'utf-8', function (err, contenido) {
            if (err) {
                reject({ mensaje: 'Error leyendo' });
            }
            else {
                var bdd = JSON.parse(contenido);
                bdd.usuarios.push(usuario);
                fs.writeFile('bdd.json', JSON.stringify(bdd), function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve({ mensaje: 'Usuario Creado' });
                    }
                });
            }
        });
    });
}
function editarUsuario(nombre, nuevoNombre, nuevaContraseña) {
    return new Promise(function (resolve, reject) {
        fs.readFile('bdd.json', 'utf-8', function (err, contenido) {
            if (err) {
                reject({ mensaje: 'Error leyendo' });
            }
            else {
                var bdd = JSON.parse(contenido);
                var indiceUsuario = bdd.usuarios
                    .findIndex(function (usuario) {
                    return usuario.nombre = nombre;
                });
                bdd.usuarios[indiceUsuario].nombre = nuevoNombre;
                bdd.usuarios[indiceUsuario].contraseña = nuevaContraseña;
                fs.writeFile('bdd.json', JSON.stringify(bdd), function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve({ mensaje: 'Usuario Editado' });
                    }
                });
            }
        });
    });
}
function buscarProductoPorNombre(nombre) {
    return new Promise(function (resolve, reject) {
        fs.readFile('bdd.json', 'utf-8', function (err, contenido) {
            if (err) {
                reject({ mensaje: 'Error leyendo' });
            }
            else {
                var bdd = JSON.parse(contenido);
                var respuestaFind = bdd.productos
                    .find(function (producto) {
                    return producto.nombre === nombre;
                });
                resolve(respuestaFind);
            }
        });
    });
}
main();
