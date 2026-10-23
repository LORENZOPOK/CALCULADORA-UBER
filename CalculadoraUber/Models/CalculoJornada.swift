import Foundation

/// Resultados derivados de los datos de una jornada.
///
/// Los datos de entrada son opcionales para poder calcular en vivo mientras se
/// llena el formulario: cada resultado es `nil` si falta algún dato que necesita.
struct CalculoJornada {
    var montoGenerado: Int?
    var kmRecorridos: Double?
    var minutosTrabajados: Int?
    var rendimiento: Double?
    var precioBencina: Int?

    /// km ÷ rendimiento.
    var litrosUsados: Double? {
        guard let kmRecorridos, let rendimiento, rendimiento > 0 else { return nil }
        return kmRecorridos / rendimiento
    }

    /// Litros × precio, redondeado al peso.
    var gastoBencina: Int? {
        guard let litrosUsados, let precioBencina else { return nil }
        return Int(exactly: (litrosUsados * Double(precioBencina)).rounded())
    }

    /// Generado − gasto en bencina.
    var gananciaNeta: Int? {
        guard let montoGenerado, let gastoBencina else { return nil }
        return montoGenerado - gastoBencina
    }

    var gananciaPorHora: Int? {
        guard let gananciaNeta, let minutosTrabajados, minutosTrabajados > 0 else { return nil }
        return Int(exactly: (Double(gananciaNeta) * 60 / Double(minutosTrabajados)).rounded())
    }

    var gananciaPorKm: Int? {
        guard let gananciaNeta, let kmRecorridos, kmRecorridos > 0 else { return nil }
        return Int(exactly: (Double(gananciaNeta) / kmRecorridos).rounded())
    }
}
