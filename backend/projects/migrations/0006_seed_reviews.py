from django.db import migrations
from django.contrib.auth import get_user_model
import random

User = get_user_model()


def seed_reviews(apps, schema_editor):
    """Seed reviews for all projects"""
    Project = apps.get_model('projects', 'Project')
    Review = apps.get_model('projects', 'Review')
    
    # Check if reviews already exist
    existing_reviews = Review.objects.count()
    if existing_reviews > 100:  # Skip if already seeded
        print(f"Reviews already exist ({existing_reviews}), skipping seed...")
        return
    
    # Clear existing reviews if any
    if existing_reviews > 0:
        print(f"Clearing {existing_reviews} existing reviews...")
        Review.objects.all().delete()
    
    # Get or create reviewer users
    reviewer_data = [
        {'email': 'reviewer1@example.com', 'username': 'reviewer1', 'first_name': 'Raj', 'last_name': 'Kumar'},
        {'email': 'reviewer2@example.com', 'username': 'reviewer2', 'first_name': 'Priya', 'last_name': 'Sharma'},
        {'email': 'reviewer3@example.com', 'username': 'reviewer3', 'first_name': 'Amit', 'last_name': 'Patel'},
        {'email': 'reviewer4@example.com', 'username': 'reviewer4', 'first_name': 'Sneha', 'last_name': 'Gupta'},
        {'email': 'reviewer5@example.com', 'username': 'reviewer5', 'first_name': 'Vikram', 'last_name': 'Singh'},
        {'email': 'reviewer6@example.com', 'username': 'reviewer6', 'first_name': 'Anita', 'last_name': 'Reddy'},
        {'email': 'reviewer7@example.com', 'username': 'reviewer7', 'first_name': 'Arjun', 'last_name': 'Mehta'},
        {'email': 'reviewer8@example.com', 'username': 'reviewer8', 'first_name': 'Kavya', 'last_name': 'Nair'},
        {'email': 'reviewer9@example.com', 'username': 'reviewer9', 'first_name': 'Rohan', 'last_name': 'Joshi'},
        {'email': 'reviewer10@example.com', 'username': 'reviewer10', 'first_name': 'Isha', 'last_name': 'Iyer'},
    ]
    
    reviewers = []
    for data in reviewer_data:
        user, created = User.objects.get_or_create(
            email=data['email'],
            defaults={
                'username': data['username'],
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'role': 'buyer'
            }
        )
        if created:
            user.set_unusable_password()
            user.save()
        reviewers.append(user)
    
    print(f"Using {len(reviewers)} reviewers")
    
    # Get all projects
    projects = Project.objects.all()
    if not projects:
        print("No projects found, skipping review seed")
        return
    
    print(f"Adding reviews to {projects.count()} projects...")
    
    total_reviews_created = 0
    reviews_per_project = 10
    
    # Review titles
    titles = {
        5: ["Excellent Project!", "Highly Recommended", "Best Investment Decision", "Outstanding Quality", "Perfect in Every Way"],
        4: ["Great Project Overall", "Very Satisfied", "Good Value for Money", "Recommended", "Happy with Purchase"],
        3: ["Decent Project", "Average Experience", "Okay, Could Be Better", "Mixed Feelings", "It's Alright"],
        2: ["Below Expectations", "Not Satisfied", "Issues with Project", "Disappointed", "Needs Improvement"],
        1: ["Very Disappointed", "Poor Quality", "Avoid This Project", "Worst Experience", "Major Problems"]
    }
    
    # Review texts
    positive_reviews = [
        "Excellent project by the developer! {} exceeded my expectations. The construction quality is top-notch and the amenities are world-class.",
        "Very impressed with {}. The location is perfect and the builder has maintained high standards throughout. Highly recommended!",
        "Great investment opportunity! {} offers excellent value for money. The project is progressing well and the team is very responsive.",
        "Wonderful experience with this project. The amenities, location, and build quality are all excellent. Very satisfied with my purchase.",
        "Outstanding project! {} has everything you could ask for. The developer is reliable and the construction is progressing as promised.",
    ]
    
    good_reviews = [
        "{} is a good project overall. The location is convenient and the amenities are decent. Minor delays but nothing major.",
        "Satisfied with my purchase. {} offers good value and the construction quality is acceptable. Would recommend to others.",
        "Good project with nice amenities. The developer is cooperative and the location is well-connected. Happy with the decision.",
        "Pretty good experience so far. {} is progressing well and the quality seems good. Looking forward to possession.",
    ]
    
    average_reviews = [
        "{} is an average project. Some good points, some areas need improvement. The location is okay but amenities could be better.",
        "It's an okay project. {} has potential but there have been some delays. Hope things improve going forward.",
        "Average experience. The project has some good features but also some concerns. Developer needs to be more transparent.",
    ]
    
    poor_reviews = [
        "Not very satisfied with {}. There have been multiple delays and some quality issues. Expected better from the developer.",
        "{} has faced several problems including delays and poor communication from the builder.",
    ]
    
    terrible_reviews = [
        "Very disappointed with {}. Major delays, poor quality, and unresponsive developer. Would not recommend.",
        "Worst decision ever. {} has been nothing but problems. Avoid at all costs!",
    ]
    
    for project in projects:
        # Vary the number of reviews per project
        num_reviews = random.randint(max(1, reviews_per_project - 2), reviews_per_project + 2)
        
        reviews_for_project = []
        used_reviewers = set()
        
        for _ in range(num_reviews):
            # Ensure each reviewer only reviews once per project
            available_reviewers = [r for r in reviewers if r.id not in used_reviewers]
            if not available_reviewers:
                break
            
            reviewer = random.choice(available_reviewers)
            used_reviewers.add(reviewer.id)
            
            # Generate weighted random rating (skewed towards positive)
            rating = random.choices([1, 2, 3, 4, 5], weights=[5, 10, 20, 35, 30], k=1)[0]
            
            # Generate title and comment
            title = random.choice(titles[rating])
            
            if rating == 5:
                comment = random.choice(positive_reviews).format(project.name)
            elif rating == 4:
                comment = random.choice(good_reviews).format(project.name)
            elif rating == 3:
                comment = random.choice(average_reviews).format(project.name)
            elif rating == 2:
                comment = random.choice(poor_reviews).format(project.name)
            else:
                comment = random.choice(terrible_reviews).format(project.name)
            
            # Generate sub-ratings
            def sub_rating(main_rating):
                variation = random.randint(-1, 1)
                return max(1, min(5, main_rating + variation))
            
            review = Review(
                project=project,
                user=reviewer,
                rating=rating,
                title=title,
                comment=comment,
                location_rating=sub_rating(rating),
                amenities_rating=sub_rating(rating),
                value_rating=sub_rating(rating),
                helpful_count=random.randint(0, 20),
                verified_buyer=random.choice([True, False]),
            )
            reviews_for_project.append(review)
        
        # Bulk create reviews for this project
        if reviews_for_project:
            Review.objects.bulk_create(reviews_for_project)
            total_reviews_created += len(reviews_for_project)
    
    print(f"✅ Successfully created {total_reviews_created} reviews for {projects.count()} projects!")


def reverse_seed_reviews(apps, schema_editor):
    """Remove seeded reviews"""
    Review = apps.get_model('projects', 'Review')
    Review.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0004_seed_large_dataset'),  # Updated to correct latest migration
    ]

    operations = [
        migrations.RunPython(seed_reviews, reverse_seed_reviews),
    ]
