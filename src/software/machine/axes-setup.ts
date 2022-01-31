import { SmartReferenceParameters } from "../cmpp/controlers/utils/smart-reference"
import { Pulses } from "../cmpp/physical-dimensions/base"
import { PulsesPerTick, PulsesPerTickSquared } from "../cmpp/physical-dimensions/physical-dimensions"
import { SingleAxisSetup, Tolerance } from "./single-axis"

export const defaultReferenceParameter: SmartReferenceParameters = {
    endPosition: Pulses(500), //TODO: BUGFIX: If you put this value to 800 you will encounter an error at referencing one of the axis.
    reference: {
        speed: PulsesPerTick(350),
        acceleration: PulsesPerTickSquared(3000)
    }
}

const defaultTolerance: Tolerance = [Pulses(4), Pulses(4)]

export const z_axis_setup: SingleAxisSetup = {
    axisName: 'Z-Axis',//
    absoluteRange: {
        min: Pulses(610),
        max: Pulses(2610),
    },
    milimeterToPulseRatio: ((12.97+12.32)/2)/100,
    smartReferenceParameters: defaultReferenceParameter,
    //
    defaultKinematics: {
        speed: PulsesPerTick(400),
        acceleration: PulsesPerTickSquared(5000)
    },
    tolerance: defaultTolerance,
    //
    preReferenceSetup: {
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

export const y_axis_setup: SingleAxisSetup = {
    axisName: 'Y-Axis',
    absoluteRange: {
        min: Pulses(610),
        max: Pulses(7310),
    },
    milimeterToPulseRatio: (69.82*0.9936/0.9984523)/1000,
    smartReferenceParameters: defaultReferenceParameter,
    //
    defaultKinematics: {
        speed: PulsesPerTick(1000),
        acceleration: PulsesPerTickSquared(1500)
    },
    tolerance: defaultTolerance,
    //
    preReferenceSetup: {
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


export const x_axis_setup: SingleAxisSetup = {
    axisName: 'X-Axis',
    absoluteRange: {
        min: Pulses(610),
        max: Pulses(8355+25),
    },
    milimeterToPulseRatio: (152.87/1000),
    smartReferenceParameters: defaultReferenceParameter,
    //
    defaultKinematics: {
        speed: PulsesPerTick(2000),
        acceleration: PulsesPerTickSquared(4000)
    },
    tolerance: defaultTolerance,
    //
    preReferenceSetup: {
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

