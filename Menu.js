var inquirer = require('inquirer');
var fs = require('fs');
var rxjs = require('rxjs');
var map = require('rxjs/operators').map;
var produtosSeleccionados = [];
var total = 0;
function enlistarProductos(arreglo) {
    console.log('\n***Productos a comprar: ***');
    console.log('   Producto\t\tPrecio');
    arreglo.forEach(function (elemnto, indice) {
        indice = indice + 1;
        console.log(indice + " " + elemnto.nombre + "\t\t" + elemnto.precio);
    });
}
function arregloProductos(arreglo) {
    var arr = [];
    arreglo.forEach(function (elemnto) {
        arr.push(elemnto.nombre);
    });
    return arr;
}
var productosABuscar = function (producto) {
    return new Promise(function (resolve, reject) {
        fs.readFile('Productos.txt', 'utf-8', function (err, contenido) {
            if (err) {
                reject(err);
            }
            else {
                var arregloUsuarios = contenido.split(/\r?\n/).map(function (linea) {
                    var users = linea.split(' ');
                    return { nombre: users[0], categoria: users[1], precio: users[2] };
                });
                arregloUsuarios
                    .forEach(function (element) {
                    if (producto === element.nombre) {
                        resolve(element.precio);
                    }
                });
            }
        });
    });
};
var promesaBuscar = function (arreglo) {
    return new Promise(function (resolve) {
        arreglo.forEach(function (elemnet) {
            productosABuscar(elemnet.productos).then(function (respuesta) {
                total = total + parseFloat(respuesta.toString());
                console.log("\t " + elemnet.productos + "\t\t" + respuesta + "\t\t" + total);
            });
        });
    });
};
function buscarProducto(arreglo) {
    console.log('\n***Productos a comprar: ***');
    console.log('   Producto\t\tPrecio\t\tTotal');
    promesaBuscar(arreglo).then(function (reg) {
        console.log(reg);
    });
}
var productos = function () {
    return new Promise(function (resolve, reject) {
        fs.readFile('Productos.txt', 'utf-8', function (err, contenido) {
            if (err) {
                reject(err);
            }
            else {
                var arregloUsuarios = contenido.split(/\r?\n/).map(function (linea) {
                    var users = linea.split(' ');
                    return { nombre: users[0], categoria: users[1], precio: users[2] };
                });
                resolve(arregloUsuarios);
            }
        });
    });
};
var ingresarUsuarios = function (nombreArchivo, contenidoArchivo) {
    return new Promise(function (resolve, reject) {
        fs.readFile(nombreArchivo, 'utf-8', function (error, contenidoArchivoLeido) {
            if (error) {
                fs.writeFile(nombreArchivo, contenidoArchivo, function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(contenidoArchivo);
                    }
                });
            }
            else {
                fs.writeFile(nombreArchivo, contenidoArchivoLeido + '\n' + contenidoArchivo, function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(contenidoArchivoLeido + '\n' + contenidoArchivo);
                    }
                });
            }
        });
    });
};
var usuarios = function (usua) {
    return new Promise(function (resolve, reject) {
        fs.readFile('Login.txt', 'utf-8', function (err, contenido) {
            if (err) {
                reject(err);
            }
            else {
                var arregloUsuarios = contenido.split(/\r?\n/).map(function (linea) {
                    var users = linea.split(' ');
                    return { user: users[0], pass: users[1] };
                });
                arregloUsuarios
                    .forEach(function (element) {
                    if (usua === element.user) {
                        resolve(element.pass);
                    }
                });
            }
        });
    });
};
//usuarios('ronald').then((contenido)=>{console.log(contenido)}).catch((err)=>{console.log(err)});
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
    choices: ['Ingresar más productos', 'Ingresar Usuarios', 'Regresar'],
    default: 2,
};
var ingresarUser = [{
        name: 'login',
        type: 'input',
        message: 'Ingrese un usuario'
    }, {
        name: 'password',
        type: 'password',
        message: 'Ingrese un contraseña',
        mask: '*'
    }];
var menuComprador = {
    name: 'menuComprador',
    type: 'list',
    message: 'Escoja una opción:',
    choices: ['Escojer producto a comprar', 'Productos a comprar', 'Regresar'],
    default: 2,
};
var login = [{
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
function menuProductos(producto) {
    inquirer.prompt([producto]).then(function (res) {
        produtosSeleccionados.push(res);
        inquirer.prompt([confirmarMasProductos]).then(function (resul) {
            if (resul.confirm === true) {
                menuProductos(producto);
            }
            else {
                subMenuComprador();
            }
        });
    });
}
function regresar() {
    inquirer.prompt(queEs).then(function (answer) {
        if (answer.queEsUsted === 'Vendedor') {
            subMenuVendedor();
        }
        else {
            subMenuComprador();
        }
    });
}
function logi() {
    inquirer.prompt(login).then(function (ans) {
        usuarios(ans.user).then(function (user) {
            if (user === ans.pass) {
                inquirer.prompt([menuVendedor]).then(function (menu) {
                    if (menu.menuVendedor === 'Regresar') {
                        regresar();
                    }
                    else if (menu.menuVendedor === 'Ingresar Usuarios') {
                        inquirer.prompt(ingresarUser).then(function (answ) {
                            var login = answ.login + ' ' + answ.password;
                            ingresarUsuarios('Login.txt', login).then(function (res) {
                                console.log('\n' + res + '\n');
                            });
                            regresar();
                        });
                    }
                    else if (menu.menuVendedor === 'Ingresar más productos') {
                        inquirer.prompt(ingresarProductos).then(function (answ) {
                            var product = answ.nombre + ' ' + answ.categoria + ' ' + answ.precio;
                            ingresarUsuarios('Productos.txt', product).then(function (res) {
                                console.log('\n' + res + '\n');
                            });
                            regresar();
                        });
                    }
                });
            }
            else {
                console.log('Usuario o contraseña incorrecta');
                logi();
            }
        }).catch(function (error) {
            console.log(error);
        });
    });
}
function subMenuVendedor() {
    logi();
}
function subMenuComprador() {
    inquirer.prompt([menuComprador]).then(function (ans) {
        if (ans.menuComprador === 'Regresar') {
            regresar();
        }
        else if (ans.menuComprador === 'Escojer producto a comprar') {
            productos().then(function (resultado) {
                var producto = {
                    name: 'productos',
                    type: 'list',
                    message: 'Escoja un producto',
                    choices: arregloProductos(resultado),
                    default: 1,
                };
                menuProductos(producto);
            });
        }
        else if (ans.menuComprador === 'Productos a comprar') {
            buscarProducto(produtosSeleccionados);
        }
    });
}
regresar();
