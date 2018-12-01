declare var require;
const inquirer = require('inquirer');
const fs = require('fs');
const rxjs = require('rxjs');
const map = require('rxjs/operators').map;
const mergeMap = require('rxjs/operators').mergeMap;
const queEs = {
    name: 'queEsUsted',
    type: 'list',
    message: '¿Qué es usted?',
    choices: ['Comprador', 'Vendedor'],
    default: 1,
};
const menuVendedor = {
    name: 'menuVendedor',
    type: 'list',
    message: 'Escoja una opción:',
    choices: ['Ingresar más productos', 'Ingresar Usuarios'],
    default: 2,
};
const ingresarUser = [{
    name: 'nombre',
    type: 'input',
    message: 'Ingrese un usuario'
}, {
    name: 'contraseña',
    type: 'password',
    message: 'Ingrese un contraseña',
    mask: '*'
}];
const menuComprador = {
    name: 'menuComprador',
    type: 'list',
    message: 'Escoja una opción:',
    choices: ['Escojer producto a comprar', 'Productos a comprar'],
    default: 2,
};
const logi = [{
    name: 'user',
    type: 'input',
    message: 'Ingrese su usuario: '
}, {
    name: 'pass',
    type: 'password',
    message: 'Ingrese su contraseña: ',
    mask: '*'
}];
const confirmarMasProductos = {
    name: 'confirm',
    type: 'confirm',
    message: 'Desea comprar mas productos',
};
const ingresarProductos = [{
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
    inicializarBase().pipe(
        mergeMap(
            (respuestaBDD: RespuestaBDD)=>{
                return preguntaQueEs().pipe(
                    map(
                        (respuesta:OpcionesPreguntaQueEs)=>{
                            return {
                                respuestaUsuario1: respuesta,
                                respuestaBDD
                            }
                        }
                    )
                )
            }
        ),
        mergeMap(
            (respuestaUsuario: RespuestaUsuario)=>{
                switch (respuestaUsuario.respuestaUsuario1.queEsUsted) {
                    case 'Comprador': {
                        return preguntasComprador().pipe(
                            map(
                                (respuestaMenuComprador: OpcionesPreguntaCompra) => {
                                    return {
                                        respuestaUsuario1:respuestaUsuario.respuestaUsuario1,
                                        respuestaCompra: respuestaMenuComprador,
                                        respuestaBDD: respuestaUsuario.respuestaBDD
                                    }
                                }
                            )
                        );
                    }
                    case 'Vendedor': {
                        return preguntasVendedor().pipe(
                            map(
                                (respuestaMenuVendedor: OpcionesPreguntaVendedor) => {
                                    return {
                                        respuestaUsuario1:respuestaUsuario.respuestaUsuario1,
                                        respuestaVenta: respuestaMenuVendedor,
                                        respuestaBDD: respuestaUsuario.respuestaBDD
                                    }
                                }
                            )
                        );
                    }
                }
            }
        ),
        mergeMap(
            (respuesta: RespuestaUsuario)=>{
                if (respuesta.respuestaUsuario1.queEsUsted==='Vendedor'){
                    switch (respuesta.respuestaVenta.menuVendedor) {
                        case 'Ingresar Usuarios':
                            return rxjs.from(inquirer.prompt(ingresarUser)).pipe(
                                map(
                                    (usuario)=>{
                                        respuesta.usuario=usuario;
                                        return respuesta;
                                    }
                                )
                            );
                        case 'Ingresar más productos':
                            return rxjs.from(inquirer.prompt(ingresarProductos)).pipe(
                                map(
                                    (productos)=>{
                                        respuesta.producto=productos;
                                        return respuesta;
                                    }
                                )
                            );
                    }
                }
                else if(respuesta.respuestaUsuario1.queEsUsted === 'Comprador'){
                    switch (respuesta.respuestaCompra.menuComprador) {
                        case 'Escojer producto a comprar':
                            //leer base
                            const productos=[];

                            respuesta.respuestaBDD.bdd.productos.forEach(
                                (elemento)=>{
                                    productos.push(elemento.nombre)
                                }
                            );
                            const listaProductos={
                                name: 'productos',
                                type: 'list',
                                message: 'Escoja una opción:\nProducto: ',
                                choices: productos,
                                default: 0,
                            };
                            return rxjs.from(inquirer.prompt(listaProductos)).pipe(
                                map(
                                    (respuestaProductos)=>{
                                        return{
                                            respuestaUsuario1:respuesta.respuestaUsuario1,
                                            respuestaCompra: respuesta.respuestaCompra,
                                            respuestaBDD: respuesta.respuestaBDD,
                                            respuestaProducto:respuestaProductos
                                        }
                                    }
                                )
                            );
                            //enlistar los productos
                            //escojemos la opcion
                        case 'Productos a comprar':
                    }
               }
            }
        ),
        map(
            (respuesta: RespuestaUsuario)=>{
                if (respuesta.respuestaUsuario1.queEsUsted === 'Vendedor'){
                    switch (respuesta.respuestaVenta.menuVendedor) {
                        case 'Ingresar Usuarios':
                            const usuario = respuesta.usuario;
                            respuesta.respuestaBDD.bdd.usuarios.push(usuario);
                            return respuesta;
                        case 'Ingresar más productos':
                            const producto = respuesta.producto;
                            respuesta.respuestaBDD.bdd.productos.push(producto);
                            return respuesta;
                    }
                }
                else if (respuesta.respuestaUsuario1.queEsUsted ==='Comprador'){
                    switch (respuesta.respuestaCompra.menuComprador) {
                    case 'Escojer producto a comprar':
                        //añadir a la compra
                            console.log(respuesta.respuestaProducto.productos);
                    case 'Productos a comprar':
                   }
               }
            }
        )
        /*,mergeMap(
            (respuesta: RespuestaUsuario) => {
                return guardarBase(respuesta.respuestaBDD.bdd);
            }
        )*/
    ).subscribe((mensaje) => {
            console.log(mensaje);
        },
        (error) => {
            console.log(error);
        }, () => {
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
    const leerBDD$=rxjs.from(leerBDD());
    return leerBDD$.pipe(
        mergeMap(
            (respuestaLeerBDD: RespuestaBDD) => {
                if (respuestaLeerBDD.bdd) {
                    // truty / {}
                    return rxjs.of(respuestaLeerBDD)
                } else {
                    // falsy / null
                    return rxjs.from(crearBDD())
                }
            }
        )
    );
}
function leerBDD() {
    return new Promise(
        (resolve) => {
            fs.readFile('bdd.json','utf-8',
                (error, contenidoLeido) => {
                    if (error) {
                        resolve({
                            mensaje: 'Base de datos vacia',
                            bdd: null
                        });
                    } else {
                        resolve({
                            mensaje: 'Si existe la Base',
                            bdd: JSON.parse(contenidoLeido)
                        });
                    }

                }
            );
        }
    );
}
function crearBDD() {
    const contenidoInicialBDD = '{"usuarios":[],"productos":[]}';
    return new Promise(
        (resolve, reject) => {
            fs.writeFile(
                'bdd.json',
                contenidoInicialBDD,
                (err) => {
                    if (err) {
                        reject({
                            mensaje: 'Error creando Base',
                            error: 500
                        });
                    } else {
                        resolve({
                            mensaje: 'BDD creada',
                            bdd: JSON.parse('{"usuarios":[],"productos":[]}')
                        });
                    }

                }
            )

        }
    )
}
function guardarBase(bdd: BaseDeDatos) {
    return new Promise(
        (resolve, reject) => {
            fs.writeFile(
                'bdd.json',
                JSON.stringify(bdd),
                (err) => {
                    if (err) {
                        reject({
                            mensaje: 'Error guardando BDD',
                            error: 500
                        })
                    } else {
                        resolve({
                            mensaje: 'BDD guardada'
                        })
                    }
                }
            )
        }
    );
}
function anadirUsuario(usuario) {
    return new Promise(
        (resolve, reject) => {
            fs.readFile('bdd.json', 'utf-8',
                (err, contenido) => {
                    if (err) {
                        reject({mensaje: 'Error leyendo'});
                    } else {
                        const bdd = JSON.parse(contenido);
                        bdd.usuarios.push(usuario);
                        fs.writeFile(
                            'bdd.json',
                            JSON.stringify(bdd),
                            (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve({mensaje: 'Usuario Creado'});
                                }
                            }
                        );
                    }
                });
        }
    );
}
function editarUsuario(nombre, nuevoNombre,nuevaContraseña) {
    return new Promise(
        (resolve, reject) => {
            fs.readFile('bdd.json', 'utf-8',
                (err, contenido) => {
                    if (err) {
                        reject({mensaje: 'Error leyendo'});
                    } else {
                        const bdd = JSON.parse(contenido);
                        const indiceUsuario = bdd.usuarios
                            .findIndex(
                                (usuario) => {
                                    return usuario.nombre = nombre;
                                }
                            );
                        bdd.usuarios[indiceUsuario].nombre = nuevoNombre;
                        bdd.usuarios[indiceUsuario].contraseña = nuevaContraseña;
                        fs.writeFile(
                            'bdd.json',
                            JSON.stringify(bdd),
                            (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve({mensaje: 'Usuario Editado'});
                                }
                            }
                        );
                    }
                });
        }
    );
}
function buscarProductoPorNombre(nombre) {
    return new Promise(
        (resolve, reject) => {
            fs.readFile('bdd.json', 'utf-8',
                (err, contenido) => {
                    if (err) {
                        reject({mensaje: 'Error leyendo'});
                    } else {
                        const bdd = JSON.parse(contenido);
                        const respuestaFind = bdd.productos
                            .find(
                                (producto) => {
                                    return producto.nombre === nombre;
                                }
                            );
                        resolve(respuestaFind);
                    }
                }
            );
        }
    );
}
interface RespuestaBDD {
    mensaje: string,
    bdd: BaseDeDatos
}
interface BaseDeDatos {
    usuarios: Usuario[];
    productos: Productos[];
}
interface Usuario {
    nombre: string;
    contraseña: string;
}
interface Productos {
    nombre: string;
    categoria: string;
    precio: number;
}
interface OpcionesPreguntaQueEs {
    queEsUsted: 'Comprador' | 'Vendedor'
}
interface OpcionesPreguntaCompra{
    menuComprador:'Escojer producto a comprar'|'Productos a comprar'
}
interface OpcionesPreguntaVendedor{
    menuVendedor: 'Ingresar más productos'| 'Ingresar Usuarios'
}
interface RespuetaProducto{
    productos:any
}
interface RespuestaUsuario {
    respuestaUsuario1?: OpcionesPreguntaQueEs,
    respuestaCompra?: OpcionesPreguntaCompra,
    respuestaVenta?: OpcionesPreguntaVendedor,
    respuestaBDD?: RespuestaBDD,
    respuestaProducto: RespuetaProducto,
    usuario?: Usuario,
    producto?:Productos
}
main()
