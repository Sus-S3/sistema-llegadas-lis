"""
lector_bridge.py
Puente entre Arduino UNO (lector NFC) y la API de Sistema Llegadas LIS.

Dependencias:
    pip install pyserial requests

Uso:
    python lector_bridge.py

Ajustá las constantes de la sección CONFIG antes de correr.
"""

import time
import serial
import requests

# ── CONFIG ────────────────────────────────────────────────────────────────────

SERIAL_PORT   = '/dev/cu.usbmodem1201'   # Mac: /dev/cu.usbmodem*  |  Windows: 'COM3'
BAUD_RATE     = 9600
API_URL       = 'https://sistema-llegadas-lis-production.up.railway.app/asistencia/marcar'
DEDUPE_SEG    = 5      # segundos para ignorar lecturas repetidas del mismo UID
TIMEOUT_SEG   = 8      # timeout HTTP

# ─────────────────────────────────────────────────────────────────────────────


def marcar_asistencia(uid: str) -> None:
    """Envía el UID a la API e imprime el resultado."""
    try:
        resp = requests.post(
            API_URL,
            json={'uid_nfc': uid},
            timeout=TIMEOUT_SEG,
        )
        data = resp.json()

        if resp.status_code == 201:
            usuario      = data.get('usuario', {}).get('nombre', '–')
            clasificacion = data.get('clasificacion') or 'sin horario'
            ya_registrado = data.get('ya_registrado', False)

            if ya_registrado:
                print(f'[BRIDGE] ⚠  {usuario} — ya registrado hoy')
            else:
                print(f'[BRIDGE] ✓  {usuario} — {clasificacion}')

        else:
            detalle = data.get('message', resp.text)
            print(f'[BRIDGE] ✗  HTTP {resp.status_code}: {detalle}')

    except requests.exceptions.ConnectionError:
        print('[BRIDGE] ✗  No se pudo conectar con la API')
    except requests.exceptions.Timeout:
        print(f'[BRIDGE] ✗  Timeout ({TIMEOUT_SEG}s) al contactar la API')
    except Exception as exc:
        print(f'[BRIDGE] ✗  Error inesperado: {exc}')


def main() -> None:
    print(f'[BRIDGE] Conectando a {SERIAL_PORT} @ {BAUD_RATE} baud...')

    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    except serial.SerialException as exc:
        print(f'[BRIDGE] ✗  No se pudo abrir el puerto serial: {exc}')
        print('[BRIDGE]    Verificá que el Arduino esté conectado y que SERIAL_PORT sea correcto.')
        return

    print('[BRIDGE] Puerto abierto. Esperando tarjetas NFC...\n')

    ultimo_uid: str       = ''
    ultimo_tiempo: float  = 0.0

    try:
        while True:
            linea = ser.readline().decode('utf-8', errors='ignore').strip()

            if not linea.startswith('UID:'):
                continue

            uid = linea[4:].strip()
            if not uid:
                continue

            ahora = time.time()

            # Ignorar lectura duplicada dentro de la ventana de deduplicación
            if uid == ultimo_uid and (ahora - ultimo_tiempo) < DEDUPE_SEG:
                continue

            ultimo_uid    = uid
            ultimo_tiempo = ahora

            print(f'[BRIDGE] → Tarjeta leída: {uid}')
            marcar_asistencia(uid)

    except KeyboardInterrupt:
        print('\n[BRIDGE] Detenido por el usuario.')
    finally:
        ser.close()
        print('[BRIDGE] Puerto serial cerrado.')


if __name__ == '__main__':
    main()
