import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Patch,
} from '@nestjs/common';
import { AuthService } from '../../security/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ActualizarPerfilDto } from '../dto/actualizar-perfil.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  // Aquí he expuesto el endpoint público que crea una cuenta de cliente aplicando validaciones automáticas.
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  // Aquí he gestionado el inicio de sesión devolviendo el par de tokens para el usuario autenticado.
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('refresh')
  // Aquí he permitido renovar el access token usando el refresh token vigente.
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Renovar token de acceso' })
  @ApiResponse({ status: 200, description: 'Token renovado exitosamente' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  // Aquí he registrado el cierre de sesión invalidando cualquier estado asociado al usuario.
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
  async logout(@Req() req) {
    return await this.authService.logout(req.user.id);
  }

  @Get('me')
  // Aquí he expuesto el perfil del usuario autenticado reutilizando el guard JWT.
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getProfile(@Req() req) {
    return await this.authService.getProfile(req.user.id);
  }

  @Patch('me')
  // Aquí he habilitado que el usuario actualice sus datos personales con validación de entrada.
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Actualizar perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente' })
  async updateProfile(@Req() req, @Body() body: ActualizarPerfilDto) {
    return await this.authService.updateProfile(req.user.id, body);
  }

  @Post('change-password')
  // Aquí he centralizado el cambio de contraseña exigiendo la verificación de la clave actual.
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Cambiar contraseña' })
  @ApiResponse({ status: 200, description: 'Contraseña cambiada exitosamente' })
  @ApiResponse({ status: 400, description: 'Contraseña actual incorrecta' })
  async changePassword(
    @Req() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return await this.authService.changePassword(
      req.user.id,
      changePasswordDto,
    );
  }
}
