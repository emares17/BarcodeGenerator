from BarcodeGenerator import BarcodeGenerator
from LabelSheetGenerator import LabelSheetGenerator
# import pandas as pd
# import os
# import csv

# def csv_converter(file):
#     read_file = pd.read_excel(file)
#     read_file.to_csv(f"{file.replace('.xlsx', '')}.csv", index = None, header=True)
#     os.remove(file)

# csv_converter('csv/locations.xlsx')

# csv_file = 'csv/locations.csv'

# def extract_csv(file):
#     inventory_dict = {}

#     with open(file, 'r', newline='') as csv_file:
#         csv_reader = csv.reader(csv_file)

#         for column in csv_reader:
#             key = column[0]
#             value = column[1]
#             inventory_dict[key] = value

#     return inventory_dict

# inventory_dict = extract_csv(csv_file)

# generator = BarcodeGenerator(width_inches=2.0, height_inches=2.0, dpi=600, inventory=inventory_dict, folder="images")

# generator.generate_image()

# sheet_generator = LabelSheetGenerator(180, 180, 5, 5, 4, 'images')

# sheet_generator.generate_sheet()


import time
import cProfile
import pstats
import io
from memory_profiler import profile
import concurrent.futures

# Define a worker function for generating barcode images
def generate_barcode(location, part, folder):
    generator = BarcodeGenerator(width_inches=2.0, height_inches=2.0, dpi=600, inventory={location: part}, folder=folder)
    generator.generate_image()

def profile_program(your_function):
    start_time = time.time()

    def wrapped_function():
        your_function()

    wrapped_function()

    end_time = time.time()
    elapsed_time = end_time - start_time

    cprofiler = cProfile.Profile()
    cprofiler.enable()
    wrapped_function()
    cprofiler.disable()

    # Save the cProfile results to a file
    profiler_stream = io.StringIO()
    stats = pstats.Stats(cprofiler, stream=profiler_stream)
    stats.strip_dirs()
    stats.sort_stats('cumulative')
    stats.print_stats()
    with open('profiler_results.txt', 'w') as profiler_file:
        profiler_file.write(profiler_stream.getvalue())

    print(f"Execution Time: {elapsed_time:.2f} seconds")

if __name__ == "__main__":
    def your_program_logic():
        from BarcodeGenerator import BarcodeGenerator
        from LabelSheetGenerator import LabelSheetGenerator
        import pandas as pd
        import os
        import csv

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

        # Use concurrent.futures to parallelize the generation of barcode images
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:  
            futures = [executor.submit(generate_barcode, location, part, 'images') for location, part in inventory_dict.items()]

            # Wait for all tasks to complete
            concurrent.futures.wait(futures)

        sheet_generator = LabelSheetGenerator(180, 180, 5, 5, 4, 'images')
        sheet_generator.generate_sheet()

    profile_program(your_program_logic)



