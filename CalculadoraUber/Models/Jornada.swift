import Foundation
import SwiftData

/// Una jornada de trabajo manejando con Uber.
@Model
final class Jornada {
    var fecha: Date
    /// Monto generado en la jornada, en pesos chilenos.
    var montoGenerado: Int
    var kmRecorridos: Double
    var minutosTrabajados: Int
    /// Rendimiento del auto, en km/L.
    var rendimiento: Double
    /// Precio de la bencina, en CLP/L.
    var precioBencina: Int

    init(
        fecha: Date,
        montoGenerado: Int,
        kmRecorridos: Double,
        minutosTrabajados: Int,
        rendimiento: Double,
        precioBencina: Int
    ) {
        self.fecha = fecha
        self.montoGenerado = montoGenerado
        self.kmRecorridos = kmRecorridos
        self.minutosTrabajados = minutosTrabajados
        self.rendimiento = rendimiento
        self.precioBencina = precioBencina
    }

    var calculo: CalculoJornada {
        CalculoJornada(
            montoGenerado: montoGenerado,
            kmRecorridos: kmRecorridos,
            minutosTrabajados: minutosTrabajados,
            rendimiento: rendimiento,
            precioBencina: precioBencina
        )
    }
}
