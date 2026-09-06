import json
import os
import io
from datetime import datetime, timedelta
from PIL import Image, ImageDraw, ImageFont

from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponse
from .models import ClickCounter
from django.urls import reverse
from django.conf import settings
# Create your views here.

def new_home(request):
    context = {
        'digital_ocean_url': settings.R2_2026_BUCKET
    }
    return render(request, 'home/new_home.html', context)

def reineistriauki(request):
    return redirect('home:meptember24')

def mepzine(request):
    return render(request, 'home/mepzine.html')

def meptember24(request):
    context = {
        'digital_ocean_url': settings.DO_SPACES_ENDPOINT
    }
    return render(request, 'home/meptember24_placeholder.html', context)

def home(request):
    try:
        # Get the click counter value
        counter, created = ClickCounter.objects.get_or_create(id=1)
    except Exception as e:
        print(f"Error retrieving or creating ClickCounter: {e}")
        counter = None
    
    # Default values for month, day, and language
    month = request.GET.get('month', 'January')
    day = request.GET.get('day', 'Monday')
    language = request.GET.get('language', 'English')

    # Generate the Twitter image URL
    twitter_image_url = request.build_absolute_uri(
        reverse('home:generate_image') + f'?month={month}&day={day}&language={language}&disposition=inline'
    )

    context = {
        'click_counter': counter.count,
        'twitter_image_url': twitter_image_url,
        'youtube_api_key': os.environ['key'],
        'holodex_api_key': os.environ['X_APIKEY'],
    }

    return render(request, 'home/home.html', context)

def increment_counter(request):
    try:
        if request.method == "POST":
            counter, _ = ClickCounter.objects.get_or_create(id=1)
            counter.count += 1

            # Define the threshold for resetting the counter
            reset_threshold = 2**31 - 1  # For IntegerField (maximum value)

            # Check if the counter exceeds the threshold
            if counter.count > reset_threshold:
                counter.count = 0

            counter.save()
            return JsonResponse({'count': counter.count})
        else:
            counter = ClickCounter.objects.get_or_create(id=1)[0]
            return JsonResponse({'count': counter.count})
    except Exception as e:
        print(f"Error in increment_counter view: {e}")
        return JsonResponse({'error': str(e)}, status=500)

def save_info(data_type, data):
    text_file = str(data_type) + ".txt"
    now = datetime.now() # check current time
    try:
        with open(text_file, "r") as f:
            prev = f.readline()
            prev = prev.strip()
            prev_time = datetime.strptime(prev, "%Y-%m-%d %H:%M:%S.%f")
            time_diff = now - prev_time
            if time_diff > timedelta(minutes=10):
                with open(text_file, "w") as f:
                    print(f"saving {str(data_type)} data")
                    f.write(str(now) + "\n")
                    f.write(json.dumps(data))
    except FileNotFoundError:
        with open(text_file, "w") as f:
            print(f"saving {str(data_type)} data")
            f.write(str(now) + "\n")
            f.write(json.dumps(data))
    except Exception as e:
        print(f"Failed to save information: {e}")
    f.close()

def get_saved_info(data_type):
    text_file = str(data_type) + ".txt"
    if os.path.exists(text_file):
        with open(text_file, "r") as f:
            f.readline()
            data = f.read()
            return json.loads(data)

mon_dict = {
    "January": "Chicken Porrdige", 
    "February": "Beautiful Plate", 
    "March": "Pandan Leaf", 
    "April": "Palm Sugar", 
    "May": "Kerupuk Putih", 
    "June": "Coconut Rice Porridge", 
    "July": "Dory Fish", 
    "August": "Peanuts", 
    "September": "Shredded Chicken", 
    "October": "Sweet Potato Cookies", 
    "November": "Salmon Fried Rice", 
    "December": "Shrimp Paste Sambal"
}

bulan_dict = {
    "January": "Bubur Ayam", 
    "February": "Piring Cantik", 
    "March": "Daun Pandan", 
    "April": "Gula Aren", 
    "May": "Kerupuk Putih", 
    "June": "Bubur Sumsum", 
    "July": "Ikan Dori", 
    "August": "Kacang Tanah", 
    "September": "Ayam Suwir", 
    "October": "Biskuit Ubi", 
    "November": "Nasreng Salmon", 
    "December": "Sambel Terasi"
}

day_dict = {
    "Monday": "Swimming", 
    "Tuesday": "Flying", 
    "Wednesday": "Sommersaulting", 
    "Thursday": "Pilates", 
    "Friday": "Leaping", 
    "Saturday": "Breakdancing", 
    "Sunday": "Floating"
}

hari_dict = {
    "Monday": "Berenang", 
    "Tuesday": "Terbang", 
    "Wednesday": "Salto", 
    "Thursday": "Pilates", 
    "Friday": "Loncat", 
    "Saturday": "Breakdance", 
    "Sunday": "Mengambang"
}

def wrap_text(text, font, max_width):
    """
    Wrap the text to fit within the specified width.
    """
    lines = []
    words = text.split(' ')
    current_line = ''

    def text_width(value):
        bbox = font.getbbox(value)
        return bbox[2] - bbox[0]

    for word in words:
        if text_width(word) > max_width:
            if current_line:
                lines.append(current_line)
                current_line = ''

            part = ''
            for char in word:
                test_part = part + char

                if text_width(test_part) > max_width:
                    if part:
                        lines.append(part + '-')
                    part = char
                else:
                    part = test_part

            current_line = part

        else:
            test_line = f"{current_line} {word}" if current_line else word

            if text_width(test_line) > max_width:
                lines.append(current_line)
                current_line = word
            else:
                current_line = test_line

    if current_line:
        lines.append(current_line)

    return lines

def generate_image(request):
    # Get the month and day from the request
    month = request.GET.get('month', '')
    day = request.GET.get('day', '')
    language = request.GET.get('language', '')
    disposition = request.GET.get('disposition', 'inline')  # Default to inline
    
    # Load an image
    base_dir = os.path.dirname(__file__)
    staticfiles = os.path.join(base_dir, "../staticfiles/home")
    img_path = os.path.join(staticfiles, "./img/reineboard.png")
    img = Image.open(img_path)
       
    # Define the text and the font
    if language == "English":
        month = mon_dict[month] # Already made dictionary
        day = day_dict[day] # Already made dictionary
    elif language == "Bahasa Indonesia":
        month = bulan_dict[month]
        day = hari_dict[day]
    text = f"{month} {day}"
    font_path = os.path.join(staticfiles, "./font/ShareTech-Regular.ttf")
    font = ImageFont.truetype(font_path, 50)  # Adjust font size as needed
    font_size = 50

    start_x, start_y = 100, 300
    end_x, end_y = 285, 450
    max_width = end_x - start_x  # Calculate max width from given coordinates
    wrapped_text = None

    # Adjust font size until text fits within the vertical boundary
    while True:
        font = ImageFont.truetype(font_path, font_size)
        wrapped_text = wrap_text(text, font, max_width)
        total_height = total_height = sum(text_height(font, line) for line in wrapped_text)
        if start_y + total_height > end_y and font_size > 10:
            font_size -= 1  # Decrease font size by 1
        else:
            break
    
    y = start_y
    draw = ImageDraw.Draw(img)
    for line in wrapped_text:
        x = start_x  # Text starts at the horizontal position of 100
        draw.text((x, y), line, font=font, fill=(26, 117, 255))
        y += text_height(font, line)

    # Save the image to a bytes buffer
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr = img_byte_arr.getvalue()

    # Return image as a HTTP response
    res = HttpResponse(img_byte_arr, content_type='image/png')
    res['Content-Disposition'] = f'{disposition}; filename="reine_khodam.png"'
    return res

def text_height(font, text):
    bbox = font.getbbox(text)
    return bbox[3] - bbox[1]