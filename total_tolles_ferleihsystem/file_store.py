"""
This module contains all file handling options
"""

import os
import hashlib
from . import APP


TMP_FILE_NAME = 'tmp.upload'


def save_file(file):
    """
    Save a file from a flask endpoint
    """
    path = os.path.join(APP.config['DATA_DIRECTORY'], TMP_FILE_NAME)
    file.save(path)
    with open(path, 'rb') as tmp_file:
        # pylint: disable=E1101
        file_hash = hashlib.sha3_256(tmp_file.read()).hexdigest()
    os.rename(path, os.path.join(APP.config['DATA_DIRECTORY'], file_hash))

    return file_hash


def read_file(file_hash):
    """
    Read a file in the store via it's hash
    """
    with open(os.path.join(APP.config['DATA_DIRECTORY'], file_hash), 'rb') as file:
        return file.read()
