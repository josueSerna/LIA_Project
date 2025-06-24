from django.test import TestCase
from django.urls import reverse

class SmokeTest(TestCase):
    def test_home_status_code(self):
        """
        Verifica que la vista principal cargue correctamente (200 o redirección si usa login).
        """
        response = self.client.get('/')
        self.assertIn(response.status_code, [200, 302])

