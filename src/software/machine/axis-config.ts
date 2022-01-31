import { Pulses } from "../cmpp/physical-dimensions/base"
import { PulsesPerTick, PulsesPerTickSquared } from "../cmpp/physical-dimensions/physical-dimensions"
import { InitialConfig, Tolerance } from "./single-axis"

const defaultTolerance: Tolerance = [Pulses(4), Pulses(4)]

export const z_axis_config: InitialConfig = {
    axisName: 'Z-Axis',//
    absoluteRange: {
        min: Pulses(610),
        max: Pulses(2610),
    },
    milimeterToPulseRatio: ((12.97+12.32)/2)/100,
    smartReferenceParameters: {
        endPosition: Pulses(800),
        reference: {
            // uma velocidade de referencia nao muito alta por se tratar do eixo vertical
            speed: PulsesPerTick(350),
            acceleration: PulsesPerTickSquared(3000)
        }
    },
    //
    defaultKinematics: {
        speed: PulsesPerTick(400),
        acceleration: PulsesPerTickSquared(5000)
    },
    tolerance: defaultTolerance,
    //
    nativeParameters: {
        'Start externo habilitado': "desligado",
        'Entrada de start entre eixo habilitado': "desligado",
        'Saida de start no avanco': "desligado",
        'Saida de start no retorno': "desligado",
        'Start automatico no avanco': "desligado",
        'Start automatico no retorno': "desligado",
        'Reducao da corrente em repouso': "desligado",
        'Giro com funcao de protecao': "ligado",
        'Giro com funcao de correcao': "desligado",
        'Pausa serial': "desligado",
    }

}

export const y_axis_config: InitialConfig = {
    axisName: 'Y-Axis',
    absoluteRange: {
        min: Pulses(610),
        max: Pulses(7310),
    },
    milimeterToPulseRatio: (69.82*0.9936/0.9984523)/1000,
    smartReferenceParameters: {
        endPosition: Pulses(800),
        reference: {
            // uma velocidade de referencia nao muito alta por se tratar do eixo vertical
            speed: PulsesPerTick(350),
            acceleration: PulsesPerTickSquared(3000)
        }
    },
    //
    defaultKinematics: {
        speed: PulsesPerTick(1000),
        acceleration: PulsesPerTickSquared(1500)
    },
    tolerance: defaultTolerance,
    //
    nativeParameters: {
        'Start externo habilitado': "desligado",
        'Entrada de start entre eixo habilitado': "desligado",
        'Saida de start no avanco': "desligado",
        'Saida de start no retorno': "desligado",
        'Start automatico no avanco': "desligado",
        'Start automatico no retorno': "desligado",
        'Reducao da corrente em repouso': "desligado",
        'Giro com funcao de protecao': "ligado",
        'Giro com funcao de correcao': "desligado",
        'Pausa serial': "desligado",
    }

}


export const x_axis_config: InitialConfig = {
    axisName: 'X-Axis',
    absoluteRange: {
        min: Pulses(610),
        max: Pulses(8355+25),
    },
    milimeterToPulseRatio: (152.87/1000),
    smartReferenceParameters: {
        endPosition: Pulses(800),
        reference: {
            // uma velocidade de referencia nao muito alta por se tratar do eixo vertical
            speed: PulsesPerTick(350),
            acceleration: PulsesPerTickSquared(3000)
        }
    },
    //
    defaultKinematics: {
        speed: PulsesPerTick(2000),
        acceleration: PulsesPerTickSquared(4000)
    },
    tolerance: defaultTolerance,
    //
    nativeParameters: {
        'Start externo habilitado': "desligado",
        'Entrada de start entre eixo habilitado': "desligado",
        'Saida de start no avanco': "desligado",
        'Saida de start no retorno': "desligado",
        'Start automatico no avanco': "desligado",
        'Start automatico no retorno': "desligado",
        'Reducao da corrente em repouso': "desligado",
        'Giro com funcao de protecao': "ligado",
        'Giro com funcao de correcao': "desligado",
        'Pausa serial': "desligado",
    }

}

