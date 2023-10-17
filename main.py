from BarcodeGenerator import BarcodeGenerator
from LabelSheetGenerator import LabelSheetGenerator
import pandas as pd
import os
import csv

def csv_converter(file):
    read_file = pd.read_excel(file)
    read_file.to_csv(f"{file.replace('.xlsx', '')}.csv", index = None, header=True)
    os.remove(file)

csv_file = 'csv/locations.csv'

def extract_csv(file):
    inventory_dict = {}

    with open(file, 'r', newline='') as csv_file:
        csv_reader = csv.reader(csv_file)

        for column in csv_reader:
            key = column[0]
            value = column[1]
            inventory_dict[key] = value

    return inventory_dict

inventory_dict = extract_csv(csv_file)

generator = BarcodeGenerator(width_inches=2.0, height_inches=2.0, dpi=600, inventory=inventory_dict, folder="images")

generator.generate_image()

sheet_generator = LabelSheetGenerator(180, 180, 5, 5, 4, 'images')

sheet_generator.generate_sheet()