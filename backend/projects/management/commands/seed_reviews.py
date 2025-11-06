from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from projects.models import Project, Review
from django.db import transaction
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Add reviews to all projects with varied ratings'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reviews-per-project',
            type=int,
            default=5,
            help='Average number of reviews per project (will vary +/- 2)'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Delete existing reviews before seeding'
        )

    def handle(self, *args, **options):
        reviews_per_project = options['reviews_per_project']
        force = options['force']

        # Check if reviews already exist
        existing_reviews = Review.objects.count()
        if existing_reviews > 0 and not force:
            self.stdout.write(
                self.style.WARNING(
                    f'Found {existing_reviews} existing reviews. Use --force to delete and reseed.'
                )
            )
            return

        if force and existing_reviews > 0:
            self.stdout.write(self.style.WARNING(f'Deleting {existing_reviews} existing reviews...'))
            Review.objects.all().delete()

        # Get all projects
        projects = Project.objects.all()
        if not projects:
            self.stdout.write(self.style.ERROR('No projects found. Run seed_large_dataset first.'))
            return

        # Get or create reviewer users
        reviewers = self._get_or_create_reviewers()
        
        self.stdout.write(self.style.SUCCESS(f'Adding reviews to {projects.count()} projects...'))

        total_reviews_created = 0

        for project in projects:
            # Vary the number of reviews per project
            num_reviews = random.randint(
                max(1, reviews_per_project - 2),
                reviews_per_project + 2
            )

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
                rating = random.choices(
                    [1, 2, 3, 4, 5],
                    weights=[5, 10, 20, 35, 30],  # More 4s and 5s
                    k=1
                )[0]

                review_title = self._generate_review_title(rating)
                review_text = self._generate_review_text(rating, project.name)

                review = Review(
                    project=project,
                    user=reviewer,
                    rating=rating,
                    title=review_title,
                    comment=review_text,
                    location_rating=self._generate_sub_rating(rating),
                    amenities_rating=self._generate_sub_rating(rating),
                    value_rating=self._generate_sub_rating(rating),
                    helpful_count=random.randint(0, 20),
                    verified_buyer=random.choice([True, False]),
                )
                reviews_for_project.append(review)

            # Bulk create reviews for this project
            if reviews_for_project:
                Review.objects.bulk_create(reviews_for_project)
                total_reviews_created += len(reviews_for_project)
                self.stdout.write(
                    f'  ✓ {project.name} - Added {len(reviews_for_project)} reviews'
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Successfully created {total_reviews_created} reviews for {projects.count()} projects!'
            )
        )

    def _get_or_create_reviewers(self):
        """Get or create reviewer users"""
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

        self.stdout.write(f'Using {len(reviewers)} reviewers')
        return reviewers

    def _generate_sub_rating(self, main_rating):
        """Generate sub-ratings that are close to the main rating"""
        variation = random.randint(-1, 1)
        sub_rating = main_rating + variation
        return max(1, min(5, sub_rating))

    def _generate_review_title(self, rating):
        """Generate review titles based on rating"""
        titles = {
            5: [
                "Excellent Project!",
                "Highly Recommended",
                "Best Investment Decision",
                "Outstanding Quality",
                "Perfect in Every Way"
            ],
            4: [
                "Great Project Overall",
                "Very Satisfied",
                "Good Value for Money",
                "Recommended",
                "Happy with Purchase"
            ],
            3: [
                "Decent Project",
                "Average Experience",
                "Okay, Could Be Better",
                "Mixed Feelings",
                "It's Alright"
            ],
            2: [
                "Below Expectations",
                "Not Satisfied",
                "Issues with Project",
                "Disappointed",
                "Needs Improvement"
            ],
            1: [
                "Very Disappointed",
                "Poor Quality",
                "Avoid This Project",
                "Worst Experience",
                "Major Problems"
            ]
        }
        return random.choice(titles[rating])

    def _generate_review_text(self, rating, project_name):
        """Generate realistic review text based on rating"""
        positive_reviews = [
            f"Excellent project by the developer! {project_name} exceeded my expectations. The construction quality is top-notch and the amenities are world-class.",
            f"Very impressed with {project_name}. The location is perfect and the builder has maintained high standards throughout. Highly recommended!",
            f"Great investment opportunity! {project_name} offers excellent value for money. The project is progressing well and the team is very responsive.",
            f"Wonderful experience with this project. The amenities, location, and build quality are all excellent. Very satisfied with my purchase.",
            f"Outstanding project! {project_name} has everything you could ask for. The developer is reliable and the construction is progressing as promised.",
        ]

        good_reviews = [
            f"{project_name} is a good project overall. The location is convenient and the amenities are decent. Minor delays but nothing major.",
            f"Satisfied with my purchase. {project_name} offers good value and the construction quality is acceptable. Would recommend to others.",
            f"Good project with nice amenities. The developer is cooperative and the location is well-connected. Happy with the decision.",
            f"Pretty good experience so far. {project_name} is progressing well and the quality seems good. Looking forward to possession.",
        ]

        average_reviews = [
            f"{project_name} is an average project. Some good points, some areas need improvement. The location is okay but amenities could be better.",
            f"It's an okay project. {project_name} has potential but there have been some delays. Hope things improve going forward.",
            f"Average experience. The project has some good features but also some concerns. Developer needs to be more transparent.",
        ]

        poor_reviews = [
            f"Not very satisfied with {project_name}. There have been multiple delays and some quality issues. Expected better from the developer.",
            f"Below expectations. {project_name} has faced several problems including delays and poor communication from the builder.",
        ]

        terrible_reviews = [
            f"Very disappointed with {project_name}. Major delays, poor quality, and unresponsive developer. Would not recommend.",
            f"Worst decision ever. {project_name} has been nothing but problems. Avoid at all costs!",
        ]

        if rating == 5:
            return random.choice(positive_reviews)
        elif rating == 4:
            return random.choice(good_reviews)
        elif rating == 3:
            return random.choice(average_reviews)
        elif rating == 2:
            return random.choice(poor_reviews)
        else:
            return random.choice(terrible_reviews)
